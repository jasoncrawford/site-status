import { describe, test, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the checker module — keep real isSoftFailure, mock checkSite
vi.mock('@/lib/checker', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/checker')>()
  return {
    ...actual,
    checkSite: vi.fn(),
  }
})

// Mock the notifications module
const mockSendIncidentEmail = vi.fn()
const mockSendIncidentSlack = vi.fn()
vi.mock('@/lib/notifications', () => ({
  sendIncidentEmail: (...args: unknown[]) => mockSendIncidentEmail(...args),
  sendIncidentSlack: (...args: unknown[]) => mockSendIncidentSlack(...args),
}))

// Mock the admin client
const mockFrom = vi.fn()
const mockSupabase = { from: mockFrom }

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}))

import { GET, POST } from '@/app/api/checks/run/route'
import { checkSite } from '@/lib/checker'

describe('POST /api/checks/run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendIncidentEmail.mockResolvedValue(undefined)
    mockSendIncidentSlack.mockResolvedValue(undefined)
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

  test('returns 500 when sites query fails', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        data: null,
        error: { message: 'connection error' },
      }),
    })

    const request = new NextRequest('http://localhost/api/checks/run', {
      method: 'POST',
      headers: { authorization: 'Bearer test-secret' },
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Failed to fetch sites')
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

  test('hard failure creates incident, sends email and Slack alerts', async () => {
    const site = { id: 'site-1', name: 'Test', url: 'https://example.com' }

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
          insert: () => ({
            select: () => ({
              single: () => ({ data: { id: 'inc-1' } }),
            }),
          }),
        }
      }
      if (table === 'contacts') {
        return {
          select: () => ({
            data: [
              { type: 'email', email: 'alice@example.com', webhook_url: null },
              { type: 'slack', email: null, webhook_url: 'https://hooks.slack.com/services/T00/B00/xxx' },
            ],
          }),
        }
      }
      return {}
    })

    vi.mocked(checkSite).mockResolvedValue({
      status: 'failure',
      statusCode: 500,
      error: 'HTTP 500',
    })

    const request = new NextRequest('http://localhost/api/checks/run', {
      method: 'POST',
      headers: { authorization: 'Bearer test-secret' },
    })

    const response = await POST(request)
    const body = await response.json()
    expect(body.checks).toBe(1)
    expect(body.incidents).toBe(1)
    expect(mockSendIncidentEmail).toHaveBeenCalledWith({
      siteName: 'Test',
      siteUrl: 'https://example.com',
      error: 'HTTP 500',
      incidentId: 'inc-1',
      contactEmails: ['alice@example.com'],
    })
    expect(mockSendIncidentSlack).toHaveBeenCalledWith({
      siteName: 'Test',
      siteUrl: 'https://example.com',
      error: 'HTTP 500',
      incidentId: 'inc-1',
      webhookUrls: ['https://hooks.slack.com/services/T00/B00/xxx'],
    })
  })

  test('single soft failure (HTTP 503) does not create incident', async () => {
    const site = { id: 'site-1', name: 'Test', url: 'https://example.com' }

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
          select: () => ({
            eq: () => ({
              eq: () => ({
                gte: () => ({
                  data: [{ status_code: 503, error: 'HTTP 503' }],
                }),
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
        }
      }
      return {}
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
    expect(body.incidents).toBe(0)
    expect(mockSendIncidentEmail).not.toHaveBeenCalled()
    expect(mockSendIncidentSlack).not.toHaveBeenCalled()
  })

  test('three soft failures within an hour creates incident', async () => {
    const site = { id: 'site-1', name: 'Test', url: 'https://example.com' }

    mockFrom.mockImplementation((table: string) => {
      if (table === 'sites') {
        return { select: () => ({ data: [site], error: null }) }
      }
      if (table === 'checks') {
        return {
          insert: () => ({
            select: () => ({
              single: () => ({
                data: { id: 'check-3', site_id: 'site-1', status: 'failure' },
              }),
            }),
          }),
          select: () => ({
            eq: () => ({
              eq: () => ({
                gte: () => ({
                  data: [
                    { status_code: 503, error: 'HTTP 503' },
                    { status_code: 502, error: 'HTTP 502' },
                    { status_code: 503, error: 'HTTP 503' },
                  ],
                }),
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
          insert: () => ({
            select: () => ({
              single: () => ({ data: { id: 'inc-1' } }),
            }),
          }),
        }
      }
      if (table === 'contacts') {
        return {
          select: () => ({
            data: [{ type: 'email', email: 'alice@example.com', webhook_url: null }],
          }),
        }
      }
      return {}
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
    expect(body.incidents).toBe(1)
    expect(mockSendIncidentEmail).toHaveBeenCalled()
    expect(mockSendIncidentSlack).toHaveBeenCalled()
  })

  test('two soft failures within an hour does not create incident', async () => {
    const site = { id: 'site-1', name: 'Test', url: 'https://example.com' }

    mockFrom.mockImplementation((table: string) => {
      if (table === 'sites') {
        return { select: () => ({ data: [site], error: null }) }
      }
      if (table === 'checks') {
        return {
          insert: () => ({
            select: () => ({
              single: () => ({
                data: { id: 'check-2', site_id: 'site-1', status: 'failure' },
              }),
            }),
          }),
          select: () => ({
            eq: () => ({
              eq: () => ({
                gte: () => ({
                  data: [
                    { status_code: 503, error: 'HTTP 503' },
                    { status_code: 504, error: 'HTTP 504' },
                  ],
                }),
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
        }
      }
      return {}
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
    expect(body.incidents).toBe(0)
    expect(mockSendIncidentEmail).not.toHaveBeenCalled()
    expect(mockSendIncidentSlack).not.toHaveBeenCalled()
  })

  test('records checks without creating incidents for successful checks', async () => {
    const site = { id: 'site-1', name: 'Test', url: 'https://example.com' }
    const mockInsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () => ({
          data: { id: 'check-1', site_id: 'site-1', status: 'success' },
        }),
      }),
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'sites') {
        return { select: () => ({ data: [site], error: null }) }
      }
      if (table === 'checks') {
        return { insert: mockInsert }
      }
      return {}
    })

    vi.mocked(checkSite).mockResolvedValue({
      status: 'success',
      statusCode: 200,
      error: null,
    })

    const request = new NextRequest('http://localhost/api/checks/run', {
      method: 'POST',
      headers: { authorization: 'Bearer test-secret' },
    })

    const response = await POST(request)
    const body = await response.json()
    expect(body.checks).toBe(1)
    expect(body.incidents).toBe(0)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success', status_code: 200 })
    )
    expect(mockSendIncidentEmail).not.toHaveBeenCalled()
    expect(mockSendIncidentSlack).not.toHaveBeenCalled()
  })

  test('skips rejected promises from Promise.allSettled', async () => {
    const site1 = { id: 'site-1', name: 'Test1', url: 'https://example.com' }
    const site2 = { id: 'site-2', name: 'Test2', url: 'https://example2.com' }

    mockFrom.mockImplementation((table: string) => {
      if (table === 'sites') {
        return { select: () => ({ data: [site1, site2], error: null }) }
      }
      if (table === 'checks') {
        return {
          insert: () => ({
            select: () => ({
              single: () => ({
                data: { id: 'check-1', site_id: 'site-2', status: 'success' },
              }),
            }),
          }),
        }
      }
      return {}
    })

    vi.mocked(checkSite)
      .mockRejectedValueOnce(new Error('DNS resolution failed'))
      .mockResolvedValueOnce({
        status: 'success',
        statusCode: 200,
        error: null,
      })

    const request = new NextRequest('http://localhost/api/checks/run', {
      method: 'POST',
      headers: { authorization: 'Bearer test-secret' },
    })

    const response = await POST(request)
    const body = await response.json()
    expect(body.checks).toBe(2)
    expect(body.incidents).toBe(0)
  })

  test('does not send alerts for existing open incident', async () => {
    const site = { id: 'site-1', name: 'Test', url: 'https://example.com' }

    mockFrom.mockImplementation((table: string) => {
      if (table === 'sites') {
        return { select: () => ({ data: [site], error: null }) }
      }
      if (table === 'checks') {
        return {
          insert: () => ({
            select: () => ({
              single: () => ({
                data: { id: 'check-2', site_id: 'site-1', status: 'failure' },
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
                  single: () => ({ data: { id: 'inc-existing' } }),
                }),
              }),
            }),
          }),
        }
      }
      return {}
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
    expect(body.incidents).toBe(0)
    expect(mockSendIncidentEmail).not.toHaveBeenCalled()
    expect(mockSendIncidentSlack).not.toHaveBeenCalled()
  })
})

describe('GET /api/checks/run (Vercel cron)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'test-secret'
  })

  test('GET handler works identically to POST (used by Vercel cron)', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        data: [],
        error: null,
      }),
    })

    const request = new NextRequest('http://localhost/api/checks/run', {
      method: 'GET',
      headers: { authorization: 'Bearer test-secret' },
    })

    const response = await GET(request)
    const body = await response.json()
    expect(body).toEqual({ message: 'No sites to check', checks: 0, incidents: 0 })
  })

  test('GET handler rejects invalid auth', async () => {
    const request = new NextRequest('http://localhost/api/checks/run', {
      method: 'GET',
      headers: { authorization: 'Bearer wrong' },
    })

    const response = await GET(request)
    expect(response.status).toBe(401)
  })
})
