import { describe, expect, it } from 'vitest'
import { driveErrorHint, formatDriveApiError, parseDriveErrorText } from '@/lib/drive-api'
import { DRIVE_FOLDER_MIME, escapeDriveQueryValue, isDriveFolder } from '@/lib/drive-files'

describe('Drive API diagnostics', () => {
  it('surfaces Google reason and a useful API-disabled hint', () => {
    const body = JSON.stringify({
      error: {
        code: 403,
        message: 'Google Drive API has not been used in project 123 before or it is disabled.',
        errors: [{ reason: 'accessNotConfigured', message: 'Drive API disabled' }],
        status: 'PERMISSION_DENIED',
      },
    })
    const message = formatDriveApiError(403, body, 'Could not start the Drive upload')
    expect(message).toContain('403 · accessNotConfigured')
    expect(message).toContain('Enable Google Drive API')
  })

  it('does not require JSON error responses', () => {
    expect(parseDriveErrorText('plain failure')).toEqual({ message: 'plain failure', reason: '' })
  })

  it('recognizes insufficient-scope errors', () => {
    expect(driveErrorHint('ACCESS_TOKEN_SCOPE_INSUFFICIENT', '')).toContain('Disconnect and reconnect Google')
  })
})

describe('Drive file helpers', () => {
  it('escapes Drive query values safely', () => {
    expect(escapeDriveQueryValue("Jesowin's \\ folder")).toBe("Jesowin\\'s \\\\ folder")
  })

  it('recognizes Drive folders', () => {
    expect(isDriveFolder({ mimeType: DRIVE_FOLDER_MIME })).toBe(true)
    expect(isDriveFolder({ mimeType: 'application/zip' })).toBe(false)
  })
})
