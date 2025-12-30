
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function sanitizeNext(next: string | null): string {
    if (!next) return '/'

    if (!next.startsWith('/')) return '/'
    if (next.startsWith('//')) return '/'
    if (next.includes('://')) return '/'
    if (next.includes('\\')) return '/'

    if (next === '/') return '/'
    if (next.startsWith('/dashboard')) return next
    if (next.startsWith('/prompts')) return next

    return '/'
}

function getRedirectBase(origin: string): string {
    const isLocalEnv = process.env.NODE_ENV === 'development'
    if (isLocalEnv) return origin

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!siteUrl) return origin

    try {
        return new URL(siteUrl).origin
    } catch {
        return origin
    }
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = sanitizeNext(searchParams.get('next'))

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const redirectBase = getRedirectBase(origin)
            return NextResponse.redirect(`${redirectBase}${next}`)
        } else {
            console.error("Auth callback error: Code exchange failed", error);
        }
    } else {
        console.error("Auth callback error: No code provided in query params");
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
