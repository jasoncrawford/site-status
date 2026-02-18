import { describe, test, expect, vi, beforeEach } from 'vitest'
import { checkSite } from '@/lib/checker'

describe('checkSite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test('returns success for HTTP 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    }))

    const result = await checkSite('https://example.com')
    expect(result).toEqual({ status: 'success', statusCode: 200, error: null })
  })

  test('returns failure for HTTP 503', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }))

    const result = await checkSite('https://example.com')
    expect(result).toEqual({ status: 'failure', statusCode: 503, error: 'HTTP 503' })
  })

  test('returns failure on timeout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      const error = new Error('The operation was aborted')
      error.name = 'AbortError'
      return Promise.reject(error)
    }))

    const result = await checkSite('https://example.com')
    expect(result).toEqual({ status: 'failure', statusCode: null, error: 'Connection timeout' })
  })

  test('returns failure on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
      new Error('getaddrinfo ENOTFOUND example.com')
    ))

    const result = await checkSite('https://example.com')
    expect(result).toEqual({
      status: 'failure',
      statusCode: null,
      error: 'getaddrinfo ENOTFOUND example.com',
    })
  })

  test('returns failure on SSL error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
      new Error('unable to verify the first certificate')
    ))

    const result = await checkSite('https://example.com')
    expect(result).toEqual({
      status: 'failure',
      statusCode: null,
      error: 'unable to verify the first certificate',
    })
  })
})
