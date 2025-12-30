
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

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = sanitizeNext(searchParams.get('next'))

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        } else {
            console.error("Auth callback error: Code exchange failed", error);
        }
    } else {
        console.error("Auth callback error: No code provided in query params");
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
