import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { GET } from '../route'

const nextResponseRedirect = vi.fn()

vi.mock('next/server', () => {
  return {
    NextResponse: {
      redirect: (url: string) => nextResponseRedirect(url),
    },
  }
})

const exchangeCodeForSession = vi.fn()

vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: async () => ({
      auth: {
        exchangeCodeForSession,
      },
    }),
  }
})

describe('/auth/callback GET', () => {
  beforeEach(() => {
    nextResponseRedirect.mockReset()
    exchangeCodeForSession.mockReset()
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('redirects to / when next is missing', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })

    const request = new Request('http://localhost/auth/callback?code=abc')
    await GET(request)

    expect(nextResponseRedirect).toHaveBeenCalledWith('http://localhost/')
  })

  it('allows /dashboard paths', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })

    const request = new Request('http://localhost/auth/callback?code=abc&next=%2Fdashboard%2Fprompts')
    await GET(request)

    expect(nextResponseRedirect).toHaveBeenCalledWith('http://localhost/dashboard/prompts')
  })

  it('allows /prompts paths', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })

    const request = new Request('http://localhost/auth/callback?code=abc&next=%2Fprompts%2Fpublic')
    await GET(request)

    expect(nextResponseRedirect).toHaveBeenCalledWith('http://localhost/prompts/public')
  })

  it('rejects protocol-based next values (open redirect attempt)', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })

    const request = new Request(
      'http://localhost/auth/callback?code=abc&next=https%3A%2F%2Fevil.com%2Fphish'
    )
    await GET(request)

    expect(nextResponseRedirect).toHaveBeenCalledWith('http://localhost/')
  })

  it('rejects scheme-relative next values (//evil.com)', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })

    const request = new Request('http://localhost/auth/callback?code=abc&next=%2F%2Fevil.com')
    await GET(request)

    expect(nextResponseRedirect).toHaveBeenCalledWith('http://localhost/')
  })

  it('rejects non-allowlisted internal paths', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })

    const request = new Request('http://localhost/auth/callback?code=abc&next=%2Fsettings')
    await GET(request)

    expect(nextResponseRedirect).toHaveBeenCalledWith('http://localhost/')
  })
})
