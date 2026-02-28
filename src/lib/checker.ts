export type CheckResult = {
  status: 'success' | 'failure'
  statusCode: number | null
  error: string | null
}

const SOFT_FAILURE_STATUS_CODES = [502, 503, 504]

const SOFT_FAILURE_ERRORS = ['Connection timeout', 'fetch failed']

export function isSoftFailure(statusCode: number | null, error: string | null): boolean {
  if (statusCode !== null && SOFT_FAILURE_STATUS_CODES.includes(statusCode)) return true
  if (statusCode === null && error !== null && SOFT_FAILURE_ERRORS.includes(error)) return true
  return false
}

export async function checkSite(url: string): Promise<CheckResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)

    if (response.ok) {
      return { status: 'success', statusCode: response.status, error: null }
    } else {
      return { status: 'failure', statusCode: response.status, error: `HTTP ${response.status}` }
    }
  } catch (err) {
    clearTimeout(timeout)

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return { status: 'failure', statusCode: null, error: 'Connection timeout' }
      }
      return { status: 'failure', statusCode: null, error: err.message }
    }

    return { status: 'failure', statusCode: null, error: 'Unknown error' }
  }
}
