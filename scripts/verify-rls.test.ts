
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

function assertEnvVar(name: string, value: string | undefined): asserts value is string {
    if (!value) {
        throw new Error(`Missing Supabase environment variable: ${name} (.env.local)`) 
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

assertEnvVar('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl)
assertEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseKey)
assertEnvVar('SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey)

const adminClient = createClient(supabaseUrl, serviceRoleKey)

describe('RLS: Category/Subcategory Visibility (Owner + Public)', () => {
    let userA: any
    let userB: any
    let userAClient: SupabaseClient
    let userBClient: SupabaseClient
    let anonClient: SupabaseClient

    beforeAll(async () => {
        const password = 'TestPassword123!'

        const emailA = `test_visibility_a_${Date.now()}@example.com`
        const { data: { user: createdA }, error: createAErr } = await adminClient.auth.admin.createUser({
            email: emailA,
            password,
            email_confirm: true
        })
        if (createAErr || !createdA) throw createAErr || new Error('Failed to create user A')
        userA = createdA

        const { data: signInA, error: signInAErr } = await adminClient.auth.signInWithPassword({
            email: emailA,
            password
        })
        if (signInAErr) throw signInAErr
        userAClient = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${signInA.session.access_token}` } }
        })

        const emailB = `test_visibility_b_${Date.now()}@example.com`
        const { data: { user: createdB }, error: createBErr } = await adminClient.auth.admin.createUser({
            email: emailB,
            password,
            email_confirm: true
        })
        if (createBErr || !createdB) throw createBErr || new Error('Failed to create user B')
        userB = createdB

        const { data: signInB, error: signInBErr } = await adminClient.auth.signInWithPassword({
            email: emailB,
            password
        })
        if (signInBErr) throw signInBErr
        userBClient = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${signInB.session.access_token}` } }
        })

        anonClient = createClient(supabaseUrl, supabaseKey)
    })

    it('should allow owner to read their private category', async () => {
        const slug = `private-cat-${Date.now()}`
        const { data: inserted, error: insertErr } = await adminClient
            .from('categories')
            .insert({ name: 'Private Cat', slug, user_id: userA.id, is_public: false })
            .select('id')
            .single()
        expect(insertErr).toBeNull()

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
        const { data: inserted, error: insertErr } = await adminClient
            .from('categories')
            .insert({ name: 'Private Cat 2', slug, user_id: userA.id, is_public: false })
            .select('id')
            .single()
        expect(insertErr).toBeNull()

        const { data: rows, error: selectErr } = await userBClient
            .from('categories')
            .select('id')
            .eq('id', inserted!.id)
        expect(selectErr).toBeNull()
        expect(rows?.length ?? 0).toBe(0)
    })

    it('should allow anonymous reading a public category and its subcategories', async () => {
        const slug = `public-cat-${Date.now()}`
        const { data: cat, error: insertCatErr } = await adminClient
            .from('categories')
            .insert({ name: 'Public Cat', slug, user_id: userA.id, is_public: true })
            .select('id')
            .single()
        expect(insertCatErr).toBeNull()

        const { data: sub, error: insertSubErr } = await adminClient
            .from('subcategories')
            .insert({ name: 'Public Sub', slug: `public-sub-${Date.now()}`, category_id: cat!.id })
            .select('id, category_id')
            .single()
        expect(insertSubErr).toBeNull()

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
        const { data: cat, error: insertCatErr } = await adminClient
            .from('categories')
            .insert({ name: 'Private Cat 3', slug, user_id: userA.id, is_public: false })
            .select('id')
            .single()
        expect(insertCatErr).toBeNull()

        const { data: sub, error: insertSubErr } = await adminClient
            .from('subcategories')
            .insert({ name: 'Private Sub', slug: `private-sub-${Date.now()}`, category_id: cat!.id })
            .select('id')
            .single()
        expect(insertSubErr).toBeNull()

        const { data: rows, error: anonErr } = await anonClient
            .from('subcategories')
            .select('id')
            .eq('id', sub!.id)
        expect(anonErr).toBeNull()
        expect(rows?.length ?? 0).toBe(0)
    })
})
describe('Data Integrity: Category and Subcategory Deletion', () => {
    let testUser: any
    let userClient: SupabaseClient
    let categoryId: string
    let subcategoryId: string
    let promptId: string

    beforeAll(async () => {
        // 1. Create a test user
        const email = `test_deletion_${Date.now()}@example.com`
        const password = 'TestPassword123!'
        const { data: { user }, error: signUpError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        })
        if (signUpError || !user) throw signUpError || new Error('Failed to create test user')
        testUser = user

        const { data: signInData, error: signInError } = await adminClient.auth.signInWithPassword({
            email,
            password
        })
        if (signInError) throw signInError
        userClient = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${signInData.session.access_token}` } }
        })

        // 2. Setup test data (Category -> Subcategory -> Prompt)
        const { data: cat, error: catErr } = await adminClient
            .from('categories')
            .insert({ name: 'Test Cat', slug: `test-cat-${Date.now()}`, user_id: testUser.id })
            .select()
            .single()
        if (catErr) throw catErr
        categoryId = cat.id

        const { data: sub, error: subErr } = await adminClient
            .from('subcategories')
            .insert({ name: 'Test Sub', slug: 'test-sub', category_id: categoryId })
            .select()
            .single()
        if (subErr) throw subErr
        subcategoryId = sub.id

        const { data: prompt, error: promptErr } = await adminClient
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

    it('should set prompt subcategory_id to null when subcategory is deleted', async () => {
        // Verify prompt has subcategory initially
        const { data: initialPrompt } = await adminClient.from('prompts').select('subcategory_id').eq('id', promptId).single()
        expect(initialPrompt?.subcategory_id).toBe(subcategoryId)

        // Delete subcategory
        const { error: deleteErr } = await adminClient.from('subcategories').delete().eq('id', subcategoryId)
        expect(deleteErr).toBeNull()

        // Verify prompt subcategory_id is now null
        const { data: updatedPrompt } = await adminClient.from('prompts').select('subcategory_id').eq('id', promptId).single()
        expect(updatedPrompt?.subcategory_id).toBeNull()
    })

    it('should set prompt subcategory_id to null when parent category is deleted (cascade)', async () => {
        // Setup new subcategory and prompt
        const { data: sub } = await adminClient
            .from('subcategories')
            .insert({ name: 'Test Sub 2', slug: 'test-sub-2', category_id: categoryId })
            .select()
            .single()
        
        await adminClient
            .from('prompts')
            .update({ subcategory_id: sub.id })
            .eq('id', promptId)

        // Delete category (should cascade delete subcategory)
        const { error: deleteErr } = await adminClient.from('categories').delete().eq('id', categoryId)
        expect(deleteErr).toBeNull()

        // Verify prompt subcategory_id is now null
        const { data: updatedPrompt } = await adminClient.from('prompts').select('subcategory_id').eq('id', promptId).single()
        expect(updatedPrompt?.subcategory_id).toBeNull()
    })
})
