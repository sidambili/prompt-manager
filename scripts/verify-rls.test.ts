
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables (.env.local)')
}

const adminClient = createClient(supabaseUrl, serviceRoleKey)

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
            .insert({ name: 'Test Cat', slug: `test-cat-${Date.now()}` })
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
