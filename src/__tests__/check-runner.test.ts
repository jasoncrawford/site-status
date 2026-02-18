import { describe, test, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the checker module
vi.mock('@/lib/checker', () => ({
  checkSite: vi.fn(),
}))

// Mock the admin client
const mockFrom = vi.fn()
const mockSupabase = { from: mockFrom }

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}))

import { POST } from '@/app/api/checks/run/route'
import { checkSite } from '@/lib/checker'

describe('POST /api/checks/run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'test-secret'
  })

  test('rejects requests without valid CRON_SECRET', async () => {
    const request = new NextRequest('http://localhost/api/checks/run', {
      method: 'POST',
      headers: { authorization: 'Bearer wrong-secret' },
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  test('rejects requests with no authorization header', async () => {
    const request = new NextRequest('http://localhost/api/checks/run', {
      method: 'POST',
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  test('returns empty result when no sites exist', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        data: [],
        error: null,
      }),
    })

    const request = new NextRequest('http://localhost/api/checks/run', {
      method: 'POST',
      headers: { authorization: 'Bearer test-secret' },
    })

    const response = await POST(request)
    const body = await response.json()
    expect(body).toEqual({ message: 'No sites to check', checks: 0, incidents: 0 })
  })

  test('records checks and opens incidents for failures', async () => {
    const site = { id: 'site-1', name: 'Test', url: 'https://example.com' }

    // Mock sites query
    const mockSelect = vi.fn()
    mockFrom.mockImplementation((table: string) => {
      if (table === 'sites') {
        return { select: () => ({ data: [site], error: null }) }
      }
      if (table === 'checks') {
        return {
          insert: () => ({
            select: () => ({
              single: () => ({
                data: { id: 'check-1', site_id: 'site-1', status: 'failure' },
              }),
            }),
          }),
        }
      }
      if (table === 'incidents') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: () => ({
                  single: () => ({ data: null }),
                }),
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({ data: null, error: null }),
        }
      }
      return { select: mockSelect }
    })

    vi.mocked(checkSite).mockResolvedValue({
      status: 'failure',
      statusCode: 503,
      error: 'HTTP 503',
    })

    const request = new NextRequest('http://localhost/api/checks/run', {
      method: 'POST',
      headers: { authorization: 'Bearer test-secret' },
    })

    const response = await POST(request)
    const body = await response.json()
    expect(body.checks).toBe(1)
    expect(body.incidents).toBe(1)
  })
})
