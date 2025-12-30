
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        const missing: string[] = []
        if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
        if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        throw new Error(`Supabase client env is missing: ${missing.join(', ')}`)
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
