export type DriveApiErrorPayload = {
  error?: {
    code?: number
    message?: string
    status?: string
    errors?: Array<{ reason?: string; message?: string; domain?: string }>
    details?: Array<{ reason?: string; domain?: string; metadata?: Record<string, string>; ['@type']?: string }>
  }
  error_description?: string
  error?: DriveApiErrorPayload['error']
}

function truncate(value: string, max = 320) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized
}

export function parseDriveErrorText(text: string) {
  if (!text) return { message: '', reason: '' }
  try {
    const payload = JSON.parse(text) as DriveApiErrorPayload
    const apiError = payload.error
    const detailReason = apiError?.details?.find((detail) => detail.reason)?.reason
    const reason = apiError?.errors?.find((item) => item.reason)?.reason ?? detailReason ?? apiError?.status ?? ''
    const message = apiError?.message ?? apiError?.errors?.find((item) => item.message)?.message ?? payload.error_description ?? ''
    return { message: truncate(message), reason: truncate(reason, 120) }
  } catch {
    return { message: truncate(text), reason: '' }
  }
}

export function driveErrorHint(reason: string, message: string) {
  const combined = `${reason} ${message}`.toLowerCase()
  if (combined.includes('accessnotconfigured') || combined.includes('service_disabled') || combined.includes('has not been used in project') || combined.includes('is disabled')) {
    return 'Enable Google Drive API in the same Google Cloud project that owns this OAuth client, then retry.'
  }
  if (combined.includes('insufficientpermissions') || combined.includes('access_token_scope_insufficient') || combined.includes('insufficient authentication scopes')) {
    return 'Disconnect and reconnect Google, then approve the Drive file permission requested by FlashUpload.'
  }
  if (combined.includes('dailylimitexceeded') || combined.includes('ratelimitexceeded') || combined.includes('userratelimitexceeded')) {
    return 'Google Drive rate limits were reached. Wait briefly and retry.'
  }
  if (combined.includes('storagequotaexceeded')) {
    return 'The connected Google Drive account does not have enough free storage for this operation.'
  }
  return ''
}

export function formatDriveApiError(status: number, responseText: string, action: string) {
  const { message, reason } = parseDriveErrorText(responseText)
  const hint = driveErrorHint(reason, message)
  const reasonPart = reason ? ` · ${reason}` : ''
  const messagePart = message ? ` ${message}` : ''
  const hintPart = hint ? ` ${hint}` : ''
  return `${action} (${status}${reasonPart}).${messagePart}${hintPart}`.trim()
}

export async function throwDriveApiError(response: Response, action: string): Promise<never> {
  const text = await response.text().catch(() => '')
  throw new Error(formatDriveApiError(response.status, text, action))
}

export async function driveJson<T>(url: string, accessToken: string, init: RequestInit = {}, action = 'Google Drive request failed'): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(url, { ...init, headers })
  if (!response.ok) await throwDriveApiError(response, action)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
