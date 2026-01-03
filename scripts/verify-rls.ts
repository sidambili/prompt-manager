
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// SUPABASE_SERVICE_ROLE_KEY is usually in .env.local for local dev, 
// need to grab it if possible or prompt user to add it. 
// For verification, we'll try to rely on "user" flows as much as possible, 
// but we need to CREATE users first.

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Anon Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyRLS() {
    console.log('--- Starting RLS Verification ---')

    const emailA = `user_a_${Date.now()}@test.com`
    const password = 'testpassword123'
    const emailB = `user_b_${Date.now()}@test.com`

    console.log(`1. Creating User A (${emailA})...`)
    const { data: { user: userA }, error: errA } = await supabase.auth.signUp({
        email: emailA,
        password: password,
    })
    if (errA || !userA) {
        // If signups require confirmation, this might "fail" to return a session without manual confirmation in local InBucket.
        // But usually supabase local auto-confirms or we can use admin to create if this fails.
        console.error('User A signup failed (might need confirmation):', errA?.message)
        // Fallback: This is a robust test only if auto-confirm is enabled or we confirm manually.
        // For local dev, we often need to manually visit the link.
        console.log('Make sure "Enable email confirmations" is OFF in config.toml for this test to run fully automated, OR check InBucket.')
        return;
    }
    console.log('User A created:', userA.id)

    console.log(`2. Creating User B (${emailB})...`)
    const { data: { user: userB }, error: errB } = await supabase.auth.signUp({
        email: emailB,
        password: password,
    })
    if (errB || !userB) {
        console.error('User B signup failed:', errB?.message)
        return;
    }
    console.log('User B created:', userB.id)

    // Client A
    const supabaseA = createClient(supabaseUrl!, supabaseKey!)
    await supabaseA.auth.signInWithPassword({ email: emailA, password })

    // Client B
    const supabaseB = createClient(supabaseUrl!, supabaseKey!)
    await supabaseB.auth.signInWithPassword({ email: emailB, password })

    // 3. Insert Categories (Need System/Admin role? Or are they public readable?)
    // Categories are protected from insert by "anon" and "authenticated". 
    // We need to insert directly via Service Role if we want to seed them now, 
    // BUT the architecture says Categories are Seeded. 
    // Let's assume a Category exists or try to insert one (expect failure)

    console.log('3. User A tries to insert a Category (Should FAIL)...')
    const { error: catError } = await supabaseA.from('categories').insert({
        name: 'Test Category',
        slug: 'test-cat',
    })
    if (catError) {
        console.log('✅ Correctly blocked categoy insert:', catError.message)
    } else {
        console.error('❌ User A was able to insert a category! RLS Failure.')
    }

    // NOTE: For the rest of the test, we need a valid category/subcategory ID.
    // Since we can't create one over the API as a normal user, you must have seeded the DB,
    // OR we need to use the Service Role here to create one for the test.

    // Checking for existing subcategories
    const { data: subcats } = await supabaseA.from('subcategories').select('id, category_id').limit(1)

    const subcatId = subcats?.[0]?.id

    if (!subcatId) {
        console.warn('⚠️ No subcategories found. Cannot test Prompt creation fully without seeding.')
        // We will mock one or stop here. But waiting for Seed is Phase 9.
        // Let's stop and ask user to run seed or we skip deeper tests.
        return;
    }

    console.log('4. User A creates a PRIVATE prompt...')
    const { data: promptA, error: createError } = await supabaseA.from('prompts').insert({
        title: 'Private Prompt A',
        content: 'Secret content',
        user_id: userA.id,
        subcategory_id: subcatId,
        is_public: false,
        slug: 'private-prompt-a'
    }).select().single()

    if (createError) {
        console.error('❌ Failed to create prompt:', createError.message)
        return;
    }
    console.log('✅ User A created private prompt:', promptA.id)

    console.log('5. User B tries to READ User A\'s private prompt (Should FAIL)...')
    const { data: readB, error: readErrorB } = await supabaseB.from('prompts').select('*').eq('id', promptA.id).single()

    if (!readB && (!readErrorB || readErrorB.code === 'PGRST116')) {
        // PGRST116 is "The result contains 0 rows" which equates to "Not found" / Hidden by RLS
        console.log('✅ User B cannot see private prompt.')
    } else {
        console.error('❌ User B can see private prompt!', readB)
    }

    console.log('6. User A makes prompt PUBLIC and LISTED...')
    await supabaseA.from('prompts').update({ is_public: true, is_listed: true }).eq('id', promptA.id)

    console.log('7. User B tries to READ User A\'s PUBLIC prompt (Should SUCCEED)...')
    const { data: readB2 } = await supabaseB.from('prompts').select('*').eq('id', promptA.id).single()

    if (readB2) {
        console.log('✅ User B saw public prompt.')
    } else {
        console.error('❌ User B still cannot see public prompt.')
    }

    console.log('8. User B tries to UPDATE User A\'s prompt (Should FAIL)...')
    const { error: updateErrorB } = await supabaseB.from('prompts').update({ title: 'Hacked' }).eq('id', promptA.id)

    // Verify if it actually changed
    const { data: verifyUpdate } = await supabaseA.from('prompts').select('title').eq('id', promptA.id).single()

    if (verifyUpdate?.title === 'Hacked') {
        console.error('❌ User B was able to update User A\'s prompt! (Actual Title: Hacked)')
    } else {
        console.log('✅ User B update had no effect (Title remains:', verifyUpdate?.title, ')')
    }

    if (updateErrorB) {
        console.log('✅ User B blocked from updating (Error returned):', updateErrorB.message)
    } else {
        // No error returned, but maybe 0 rows updated (which is also protection)
        console.log('⚠️ User B update returned no error (likely 0 rows updated). Verified via title check above.')
    }

    console.log('9. User A updates Tags (Should SUCCEED)...')
    const { error: tagErrorA } = await supabaseA.from('prompts').update({ tags: ['test', 'rls'] }).eq('id', promptA.id)
    if (tagErrorA) {
        console.error('❌ User A failed to update tags:', tagErrorA.message)
    } else {
        const { data: verTag } = await supabaseA.from('prompts').select('tags').eq('id', promptA.id).single()
        if (JSON.stringify(verTag?.tags) === JSON.stringify(['test', 'rls'])) {
            console.log('✅ User A updated tags.')
        } else {
            console.error('❌ User A update tags silently failed.')
        }
    }

    console.log('10. User B tries to update Tags (Should FAIL)...')
    const { error: tagErrorB } = await supabaseB.from('prompts').update({ tags: ['hacked'] }).eq('id', promptA.id)
    const { data: verTagB } = await supabaseA.from('prompts').select('tags').eq('id', promptA.id).single()

    if (JSON.stringify(verTagB?.tags) === JSON.stringify(['test', 'rls'])) {
        console.log('✅ User B blocked from updating tags.')
    } else {
        console.error('❌ User B successfully updated tags to:', verTagB?.tags)
    }

    console.log('11. User B tries to update is_listed (Should FAIL)...')
    const { error: listedErrorB } = await supabaseB.from('prompts').update({ is_listed: false }).eq('id', promptA.id)
    const { data: verListed } = await supabaseA.from('prompts').select('is_listed').eq('id', promptA.id).single()

    if (verListed?.is_listed === true) {
        console.log('✅ User B blocked from updating is_listed.')
    } else {
        console.error('❌ User B successfully changed is_listed status.')
    }

    console.log('--- RLS Verification Complete ---')
}

verifyRLS().catch(console.error)
