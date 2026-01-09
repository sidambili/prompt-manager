
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const runRlsTests = process.env.RUN_RLS_TESTS === 'true'
const describeRls = runRlsTests ? describe : describe.skip

function assertEnvVar(name: string, value: string | undefined): asserts value is string {
    if (!value) {
        throw new Error(`Missing Supabase environment variable: ${name} (.env.local)`) 
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let adminClient: SupabaseClient | null = null

if (runRlsTests) {
    assertEnvVar('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl)
    assertEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseKey)
    assertEnvVar('SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey)

    adminClient = createClient(supabaseUrl!, serviceRoleKey!)}

async function cleanupRlsTestArtifacts(): Promise<void> {
    const categorySlugFilter = 'slug.like.private-cat-%,slug.like.private-cat-deny-%,slug.like.private-cat-sub-%,slug.like.public-cat-%'
    const subcategorySlugFilter = 'slug.like.public-sub-%,slug.like.private-sub-%'

    const { error: deleteSubErr } = await adminClient!
        .from('subcategories')
        .delete()
        .or(subcategorySlugFilter)
    if (deleteSubErr) {
        console.warn('[Cleanup] Failed pre-sweep delete for subcategories:', deleteSubErr.message)
    }

    const { error: deleteCatErr } = await adminClient!
        .from('categories')
        .delete()
        .or(categorySlugFilter)
    if (deleteCatErr) {
        console.warn('[Cleanup] Failed pre-sweep delete for categories:', deleteCatErr.message)
    }

    const emailPrefixes = [
        'test_visibility_a_',
        'test_visibility_b_',
        'test_deletion_',
        'test_deletion_other_',
    ]

    const pageSize = 100
    let page = 1
    for (;;) {
        const { data, error } = await adminClient!.auth.admin.listUsers({ page, perPage: pageSize })
        if (error) {
            console.warn('[Cleanup] Failed to list users for pre-sweep cleanup:', error.message)
            break
        }

        const users = data?.users ?? []
        for (const user of users) {
            const email = user.email
            if (!email) continue

            const shouldDelete = emailPrefixes.some((prefix) => email.startsWith(prefix))
            if (!shouldDelete) continue

            const { error: deleteUserErr } = await adminClient!.auth.admin.deleteUser(user.id)
            if (deleteUserErr) {
                console.warn(`[Cleanup] Failed to delete test user ${email}:`, deleteUserErr.message)
            }
        }

        if (users.length < pageSize) break
        page += 1
    }
}

if (runRlsTests) {
    beforeAll(async () => {
        await cleanupRlsTestArtifacts()
    })
}

interface TestUser {
    id: string;
    email?: string;
}

describeRls('RLS: Category/Subcategory Visibility (Owner + Public)', () => {
    let userA: TestUser
    let userB: TestUser
    let userAClient: SupabaseClient
    let userBClient: SupabaseClient
    let anonClient: SupabaseClient
    const createdCategoryIds: string[] = []
    const createdSubcategoryIds: string[] = []

    beforeAll(async () => {
        const password = 'TestPassword123!'

        const emailA = `test_visibility_a_${Date.now()}@example.com`
        const { data: { user: createdA }, error: createAErr } = await adminClient!.auth.admin.createUser({
            email: emailA,
            password,
            email_confirm: true
        })
        if (createAErr || !createdA) throw createAErr || new Error('Failed to create user A')
        userA = createdA

        const { data: signInA, error: signInAErr } = await adminClient!.auth.signInWithPassword({
            email: emailA,
            password
        })
        if (signInAErr) throw signInAErr
        userAClient = createClient(supabaseUrl!, supabaseKey!, {
            global: { headers: { Authorization: `Bearer ${signInA.session.access_token}` } }
        })

        const emailB = `test_visibility_b_${Date.now()}@example.com`
        const { data: { user: createdB }, error: createBErr } = await adminClient!.auth.admin.createUser({
            email: emailB,
            password,
            email_confirm: true
        })
        if (createBErr || !createdB) throw createBErr || new Error('Failed to create user B')
        userB = createdB

        const { data: signInB, error: signInBErr } = await adminClient!.auth.signInWithPassword({
            email: emailB,
            password
        })
        if (signInBErr) throw signInBErr
        userBClient = createClient(supabaseUrl!, supabaseKey!, {
            global: { headers: { Authorization: `Bearer ${signInB.session.access_token}` } }
        })

        anonClient = createClient(supabaseUrl!, supabaseKey!)
    })

    afterAll(async () => {
        try {
            console.log(`[Cleanup] Deleting any remaining subcategories...`)
            for (const subId of createdSubcategoryIds) {
                const { data: deletedSubcategories, error } = await adminClient!
                    .from('subcategories')
                    .delete()
                    .eq('id', subId)
                    .select('id')
                if (error) {
                    console.warn(`[Cleanup] Failed to delete subcategory ${subId}:`, error.message)
                } else {
                    if ((deletedSubcategories?.length ?? 0) === 0) {
                        console.warn(`[Cleanup] Subcategory delete affected 0 rows: ${subId}`)
                    } else {
                        console.log(`[Cleanup] Deleted subcategory ${subId}`)
                    }
                }
            }

            console.log(`[Cleanup] Deleting ${createdCategoryIds.length} categories (will cascade to subcategories)...`)
            for (const catId of createdCategoryIds) {
                const { data: deletedCategories, error } = await adminClient!
                    .from('categories')
                    .delete()
                    .eq('id', catId)
                    .select('id')
                if (error) {
                    console.warn(`[Cleanup] Failed to delete category ${catId}:`, error.message)
                } else {
                    if ((deletedCategories?.length ?? 0) === 0) {
                        console.warn(`[Cleanup] Category delete affected 0 rows: ${catId}`)
                    } else {
                        console.log(`[Cleanup] Deleted category ${catId}`)
                    }
                }
            }

            const { data: leftoverCategories, error: leftoverCategoriesErr } = await adminClient!
                .from('categories')
                .select('id, slug')
                .or('slug.like.private-cat-%,slug.like.private-cat-deny-%,slug.like.private-cat-sub-%,slug.like.public-cat-%')
            if (leftoverCategoriesErr) {
                console.warn('[Cleanup] Failed to list leftover categories:', leftoverCategoriesErr.message)
            } else if ((leftoverCategories?.length ?? 0) > 0) {
                console.warn(`[Cleanup] Found leftover categories: ${leftoverCategories?.map((c) => c.slug).join(', ')}`)
                const { error: sweepErr } = await adminClient!
                    .from('categories')
                    .delete()
                    .or('slug.like.private-cat-%,slug.like.private-cat-deny-%,slug.like.private-cat-sub-%,slug.like.public-cat-%')
                if (sweepErr) {
                    console.warn('[Cleanup] Failed to sweep-delete leftover categories:', sweepErr.message)
                }
            }

            const { data: leftoverSubcategories, error: leftoverSubcategoriesErr } = await adminClient!
                .from('subcategories')
                .select('id, slug')
                .or('slug.like.public-sub-%,slug.like.private-sub-%')
            if (leftoverSubcategoriesErr) {
                console.warn('[Cleanup] Failed to list leftover subcategories:', leftoverSubcategoriesErr.message)
            } else if ((leftoverSubcategories?.length ?? 0) > 0) {
                console.warn(`[Cleanup] Found leftover subcategories: ${leftoverSubcategories?.map((s) => s.slug).join(', ')}`)
                const { error: sweepSubErr } = await adminClient!
                    .from('subcategories')
                    .delete()
                    .or('slug.like.public-sub-%,slug.like.private-sub-%')
                if (sweepSubErr) {
                    console.warn('[Cleanup] Failed to sweep-delete leftover subcategories:', sweepSubErr.message)
                }
            }

            if (userA?.id) {
                const { error } = await adminClient!.auth.admin.deleteUser(userA.id)
                if (error) console.warn('[Cleanup] Failed to delete User A:', error.message)
                else console.log('[Cleanup] Deleted User A')
            }
            if (userB?.id) {
                const { error } = await adminClient!.auth.admin.deleteUser(userB.id)
                if (error) console.warn('[Cleanup] Failed to delete User B:', error.message)
                else console.log('[Cleanup] Deleted User B')
            }

            console.log('[Cleanup] First test suite cleanup complete')
        } catch (cleanupError) {
            console.error('[Cleanup] Error in first test suite:', cleanupError)
        }
    })

    it('should allow owner to read their private category', async () => {
        const slug = `private-cat-${Date.now()}`
        const { data: inserted, error: insertErr } = await userAClient
            .from('categories')
            .insert({ name: 'Private Cat', slug, user_id: userA.id, is_public: false })
            .select('id')
            .single()
        expect(insertErr).toBeNull()
        if (inserted?.id) createdCategoryIds.push(inserted.id)

        const { data: rows, error: selectErr } = await userAClient
            .from('categories')
            .select('id, slug, is_public')
            .eq('id', inserted!.id)
        expect(selectErr).toBeNull()
        expect(rows?.length).toBe(1)
        expect(rows?.[0]?.slug).toBe(slug)
        expect(rows?.[0]?.is_public).toBe(false)
    })

    it('should deny non-owner reading a private category', async () => {
        const slug = `private-cat-deny-${Date.now()}`
        const { data: inserted, error: insertErr } = await userAClient
            .from('categories')
            .insert({ name: 'Private Cat 2', slug, user_id: userA.id, is_public: false })
            .select('id')
            .single()
        expect(insertErr).toBeNull()
        if (inserted?.id) createdCategoryIds.push(inserted.id)

        const { data: rows, error: selectErr } = await userBClient
            .from('categories')
            .select('id')
            .eq('id', inserted!.id)
        expect(selectErr).toBeNull()
        expect(rows?.length ?? 0).toBe(0)
    })

    it('should allow anonymous reading a public category and its subcategories', async () => {
        const slug = `public-cat-${Date.now()}`
        const { data: cat, error: insertCatErr } = await userAClient
            .from('categories')
            .insert({ name: 'Public Cat', slug, user_id: userA.id, is_public: true })
            .select('id')
            .single()
        expect(insertCatErr).toBeNull()
        if (cat?.id) createdCategoryIds.push(cat.id)

        const { data: sub, error: insertSubErr } = await userAClient
            .from('subcategories')
            .insert({ name: 'Public Sub', slug: `public-sub-${Date.now()}`, category_id: cat!.id })
            .select('id, category_id')
            .single()
        expect(insertSubErr).toBeNull()
        if (sub?.id) createdSubcategoryIds.push(sub.id)

        const { data: catRows, error: anonCatErr } = await anonClient
            .from('categories')
            .select('id')
            .eq('id', cat!.id)
        expect(anonCatErr).toBeNull()
        expect(catRows?.length).toBe(1)

        const { data: subRows, error: anonSubErr } = await anonClient
            .from('subcategories')
            .select('id')
            .eq('id', sub!.id)
        expect(anonSubErr).toBeNull()
        expect(subRows?.length).toBe(1)
    })

    it('should deny anonymous reading subcategories under a private category', async () => {
        const slug = `private-cat-sub-${Date.now()}`
        const { data: cat, error: insertCatErr } = await userAClient
            .from('categories')
            .insert({ name: 'Private Cat 3', slug, user_id: userA.id, is_public: false })
            .select('id')
            .single()
        expect(insertCatErr).toBeNull()
        if (cat?.id) createdCategoryIds.push(cat.id)

        const { data: sub, error: insertSubErr } = await userAClient
            .from('subcategories')
            .insert({ name: 'Private Sub', slug: `private-sub-${Date.now()}`, category_id: cat!.id })
            .select('id')
            .single()
        expect(insertSubErr).toBeNull()
        if (sub?.id) createdSubcategoryIds.push(sub.id)

        const { data: rows, error: anonErr } = await anonClient
            .from('subcategories')
            .select('id')
            .eq('id', sub!.id)
        expect(anonErr).toBeNull()
        expect(rows?.length ?? 0).toBe(0)
    })
})

describeRls('Data Integrity: Category and Subcategory Deletion', () => {
    let testUser: TestUser
    let userClient: SupabaseClient
    let otherUser: TestUser
    let otherUserClient: SupabaseClient
    let categoryId: string
    let subcategoryId: string
    let promptId: string
    const additionalSubcategoryIds: string[] = []

    beforeAll(async () => {
        // 1. Create a test user
        const email = `test_deletion_${Date.now()}@example.com`
        const password = 'TestPassword123!'
        const { data: { user }, error: signUpError } = await adminClient!.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        })
        if (signUpError || !user) throw signUpError || new Error('Failed to create test user')
        testUser = user

        const { data: signInData, error: signInError } = await adminClient!.auth.signInWithPassword({
            email,
            password
        })
        if (signInError) throw signInError
        userClient = createClient(supabaseUrl!, supabaseKey!, {
            global: { headers: { Authorization: `Bearer ${signInData.session.access_token}` } }
        })

        const otherEmail = `test_deletion_other_${Date.now()}@example.com`
        const { data: { user: otherCreated }, error: otherCreateErr } = await adminClient!.auth.admin.createUser({
            email: otherEmail,
            password,
            email_confirm: true
        })
        if (otherCreateErr || !otherCreated) throw otherCreateErr || new Error('Failed to create other test user')
        otherUser = otherCreated

        const { data: otherSignInData, error: otherSignInError } = await adminClient!.auth.signInWithPassword({
            email: otherEmail,
            password
        })
        if (otherSignInError) throw otherSignInError
        otherUserClient = createClient(supabaseUrl!, supabaseKey!, {
            global: { headers: { Authorization: `Bearer ${otherSignInData.session.access_token}` } }
        })

        // 2. Setup test data (Category -> Subcategory -> Prompt)
        const { data: cat, error: catErr } = await userClient
            .from('categories')
            .insert({ name: 'Test Cat', slug: `test-cat-${Date.now()}`, user_id: testUser.id })
            .select()
            .single()
        if (catErr) throw catErr
        categoryId = cat.id

        const { data: sub, error: subErr } = await userClient
            .from('subcategories')
            .insert({ name: 'Test Sub', slug: 'test-sub', category_id: categoryId })
            .select()
            .single()
        if (subErr) throw subErr
        subcategoryId = sub.id

        const { data: prompt, error: promptErr } = await userClient
            .from('prompts')
            .insert({
                title: 'Test Prompt',
                content: 'Test content',
                user_id: testUser.id,
                subcategory_id: subcategoryId,
                slug: `test-prompt-${Date.now()}`
            })
            .select()
            .single()
        if (promptErr) throw promptErr
        promptId = prompt.id
    })

    afterAll(async () => {
        try {
            console.log(`[Cleanup] Deleting ${additionalSubcategoryIds.length} additional subcategories...`)
            for (const subId of additionalSubcategoryIds) {
                const { error } = await adminClient!.from('subcategories').delete().eq('id', subId)
                if (error) {
                    console.warn(`[Cleanup] Failed to delete subcategory ${subId}:`, error.message)
                }
            }
            if (promptId) {
                const { error } = await adminClient!.from('prompts').delete().eq('id', promptId)
                if (error) console.warn(`[Cleanup] Failed to delete prompt ${promptId}:`, error.message)
            }
            if (subcategoryId) {
                const { error } = await adminClient!.from('subcategories').delete().eq('id', subcategoryId)
                if (error) console.warn(`[Cleanup] Failed to delete subcategory ${subcategoryId}:`, error.message)
            }
            if (categoryId) {
                const { error } = await adminClient!.from('categories').delete().eq('id', categoryId)
                if (error) console.warn(`[Cleanup] Failed to delete category ${categoryId}:`, error.message)
            }
            if (testUser?.id) {
                const { error } = await adminClient!.auth.admin.deleteUser(testUser.id)
                if (error) console.warn('[Cleanup] Failed to delete test user:', error.message)
            }
            if (otherUser?.id) {
                const { error } = await adminClient!.auth.admin.deleteUser(otherUser.id)
                if (error) console.warn('[Cleanup] Failed to delete other user:', error.message)
            }
            console.log('[Cleanup] Second test suite cleanup complete')
        } catch (cleanupError) {
            console.error('[Cleanup] Error in second test suite:', cleanupError)
        }
    })

    it('should move prompt to parent category when subcategory is deleted', async () => {
        const { data: initialPrompt } = await userClient
            .from('prompts')
            .select('subcategory_id, category_id')
            .eq('id', promptId)
            .single()
        expect(initialPrompt?.subcategory_id).toBe(subcategoryId)
        expect(initialPrompt?.category_id ?? null).toBeNull()

        const { error: deleteErr } = await userClient
            .rpc('delete_subcategory_reassign_prompts', { p_subcategory_id: subcategoryId })
        expect(deleteErr).toBeNull()

        const { data: updatedPrompt } = await userClient
            .from('prompts')
            .select('subcategory_id, category_id')
            .eq('id', promptId)
            .single()
        expect(updatedPrompt?.subcategory_id ?? null).toBeNull()
        expect(updatedPrompt?.category_id).toBe(categoryId)
    })

    it('should deny non-owner deleting a subcategory via the RPC', async () => {
        const { data: sub, error: subErr } = await userClient
            .from('subcategories')
            .insert({ name: 'Other Owner Sub', slug: `other-owner-sub-${Date.now()}`, category_id: categoryId })
            .select('id')
            .single()
        expect(subErr).toBeNull()
        expect(sub?.id).toBeTruthy()
        if (sub?.id) additionalSubcategoryIds.push(sub.id)

        const { error: unauthorizedErr } = await otherUserClient
            .rpc('delete_subcategory_reassign_prompts', { p_subcategory_id: sub!.id })
        expect(unauthorizedErr).not.toBeNull()

        const { data: stillThere, error: stillThereErr } = await userClient
            .from('subcategories')
            .select('id')
            .eq('id', sub!.id)
            .single()
        expect(stillThereErr).toBeNull()
        expect(stillThere?.id).toBe(sub!.id)
    })

    it('should delete a subcategory with no prompts assigned', async () => {
        const { data: emptySub, error: emptySubErr } = await userClient
            .from('subcategories')
            .insert({ name: 'Empty Sub', slug: `empty-sub-${Date.now()}`, category_id: categoryId })
            .select('id')
            .single()
        expect(emptySubErr).toBeNull()

        const { error: deleteErr } = await userClient
            .rpc('delete_subcategory_reassign_prompts', { p_subcategory_id: emptySub!.id })
        expect(deleteErr).toBeNull()

        const { data: rows, error: selectErr } = await userClient
            .from('subcategories')
            .select('id')
            .eq('id', emptySub!.id)
        expect(selectErr).toBeNull()
        expect(rows?.length ?? 0).toBe(0)
    })

    it('should set prompt subcategory_id to null when parent category is deleted (cascade)', async () => {
        // Setup new subcategory and prompt
        const { data: sub, error: subErr } = await userClient
            .from('subcategories')
            .insert({ name: 'Test Sub 2', slug: 'test-sub-2', category_id: categoryId })
            .select()
            .single()

        expect(subErr).toBeNull()
        if (!sub) {
            throw new Error('Failed to create subcategory for cascade test')
        }
        
        const { error: updateErr } = await userClient
            .from('prompts')
            .update({ subcategory_id: sub.id, category_id: null })
            .eq('id', promptId)

        expect(updateErr).toBeNull()

        // Delete category (should cascade delete subcategory)
        const { error: deleteErr } = await userClient
            .from('categories')
            .delete()
            .eq('id', categoryId)
        expect(deleteErr).toBeNull()

        // Verify prompt subcategory_id is now null (subcategory was cascade-deleted)
        // and category_id is null (category deletion sets it null)
        const { data: updatedPrompt } = await userClient
            .from('prompts')
            .select('subcategory_id, category_id')
            .eq('id', promptId)
            .single()
        expect(updatedPrompt?.subcategory_id).toBeNull()
        expect(updatedPrompt?.category_id ?? null).toBeNull()
    })
})
