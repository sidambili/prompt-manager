import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { getDeploymentMode } from '@/lib/deployment'

export async function middleware(request: NextRequest) {
    const response = await updateSession(request)
    response.headers.set('x-pm-middleware', '1')
    response.headers.set('x-pm-deployment-mode', getDeploymentMode())
    response.headers.set('x-pm-pathname', request.nextUrl.pathname)
    return response
}

export const config = {
    matcher: [
        '/',
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
