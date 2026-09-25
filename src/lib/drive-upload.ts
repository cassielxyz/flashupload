import { throwDriveApiError } from '@/lib/drive-api'
import { sleep } from '@/lib/utils'

export const CHUNK_GRANULARITY = 256 * 1024
export const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024
export const MAX_RETRIES = 5

export type DriveFile = {
  id: string
  name: string
  size?: string
  mimeType?: string
  webViewLink?: string
}

export type UploadProgress = {
  uploadedBytes: number
  totalBytes: number
  speedBytesPerSecond: number
  etaSeconds: number
  chunkSize: number
}

export type UploadControls = {
  accessToken: string
  signal: AbortSignal
  previousSessionUrl?: string
  previousUploadedBytes?: number
  parentId?: string
  onSession?: (sessionUrl: string) => void
  onProgress?: (progress: UploadProgress) => void
}

export function normalizeChunkSize(bytes: number) {
  const clamped = Math.max(CHUNK_GRANULARITY, bytes)
  return Math.floor(clamped / CHUNK_GRANULARITY) * CHUNK_GRANULARITY
}

export function getAdaptiveChunkSize(bytesPerSecond: number) {
  const mbps = (bytesPerSecond * 8) / 1_000_000
  if (mbps >= 40) return 32 * 1024 * 1024
  if (mbps >= 12) return 16 * 1024 * 1024
  return DEFAULT_CHUNK_SIZE
}

export function parseRangeEnd(range: string | null) {
  if (!range) return -1
  const match = /bytes=0-(\d+)/i.exec(range)
  return match ? Number(match[1]) : -1
}

export function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500
}

async function initiateResumableSession(file: File, accessToken: string, signal: AbortSignal, parentId?: string) {
  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,size,mimeType,webViewLink',
    {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': file.type || 'application/octet-stream',
        'X-Upload-Content-Length': String(file.size),
      },
      body: JSON.stringify({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        ...(parentId ? { parents: [parentId] } : {}),
      }),
    },
  )
  if (!response.ok) await throwDriveApiError(response, 'Could not start the Drive upload')
  const sessionUrl = response.headers.get('Location')
  if (!sessionUrl) throw new Error('Google Drive did not return a resumable upload session.')
  return sessionUrl
}

export async function queryResumableStatus(sessionUrl: string, totalSize: number, signal?: AbortSignal) {
  const response = await fetch(sessionUrl, {
    method: 'PUT',
    signal,
    headers: { 'Content-Range': `bytes */${totalSize}` },
  })
  if (response.status === 308) return parseRangeEnd(response.headers.get('Range')) + 1
  if (response.ok) return totalSize
  if (response.status === 404) throw new Error('This resumable session expired. Restart the file upload.')
  await throwDriveApiError(response, 'Could not resume the Drive upload')
}

async function uploadChunk(sessionUrl: string, file: File, start: number, chunkSize: number, signal: AbortSignal) {
  const endExclusive = Math.min(start + chunkSize, file.size)
  const chunk = file.slice(start, endExclusive)
  const response = await fetch(sessionUrl, {
    method: 'PUT',
    signal,
    headers: {
      'Content-Range': `bytes ${start}-${endExclusive - 1}/${file.size}`,
    },
    body: chunk,
  })
  return { response, endExclusive }
}

export async function uploadFileToDrive(file: File, controls: UploadControls): Promise<DriveFile> {
  const { accessToken, signal, onSession, onProgress } = controls
  let sessionUrl = controls.previousSessionUrl
  let uploadedBytes = controls.previousUploadedBytes ?? 0
  let chunkSize = DEFAULT_CHUNK_SIZE
  let smoothSpeed = 0

  if (!sessionUrl) {
    sessionUrl = await initiateResumableSession(file, accessToken, signal, controls.parentId)
    onSession?.(sessionUrl)
  } else {
    uploadedBytes = await queryResumableStatus(sessionUrl, file.size, signal)
  }

  while (uploadedBytes < file.size) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    let attempt = 0

    while (attempt <= MAX_RETRIES) {
      const started = performance.now()
      try {
        const { response, endExclusive } = await uploadChunk(sessionUrl, file, uploadedBytes, chunkSize, signal)
        const elapsedSeconds = Math.max((performance.now() - started) / 1000, 0.01)
        const sentBytes = endExclusive - uploadedBytes
        const instantSpeed = sentBytes / elapsedSeconds
        smoothSpeed = smoothSpeed === 0 ? instantSpeed : smoothSpeed * 0.65 + instantSpeed * 0.35
        chunkSize = normalizeChunkSize(getAdaptiveChunkSize(smoothSpeed))

        if (response.status === 308) {
          const confirmedEnd = parseRangeEnd(response.headers.get('Range'))
          uploadedBytes = confirmedEnd >= 0 ? confirmedEnd + 1 : endExclusive
          onProgress?.({
            uploadedBytes,
            totalBytes: file.size,
            speedBytesPerSecond: smoothSpeed,
            etaSeconds: smoothSpeed > 0 ? (file.size - uploadedBytes) / smoothSpeed : Infinity,
            chunkSize,
          })
          break
        }

        if (response.ok) {
          const result = (await response.json()) as DriveFile
          onProgress?.({ uploadedBytes: file.size, totalBytes: file.size, speedBytesPerSecond: smoothSpeed, etaSeconds: 0, chunkSize })
          return result
        }

        if (!isRetryableStatus(response.status)) await throwDriveApiError(response, 'Google Drive rejected the upload')
      } catch (cause) {
        if (signal.aborted) throw cause
        if (cause instanceof Error && cause.message.startsWith('Google Drive rejected')) throw cause
        if (attempt >= MAX_RETRIES) throw cause
      }

      attempt += 1
      if (attempt > MAX_RETRIES) throw new Error('Upload failed after several retries.')
      await sleep(Math.min(30_000, 700 * 2 ** (attempt - 1) + Math.random() * 500), signal)

      try {
        uploadedBytes = await queryResumableStatus(sessionUrl, file.size, signal)
        if (uploadedBytes >= file.size) throw new Error('Upload completed but Drive metadata was not returned. Check your Drive.')
      } catch (cause) {
        if (signal.aborted) throw cause
        if (cause instanceof Error && cause.message.includes('expired')) throw cause
      }
    }
  }

  throw new Error('Upload ended unexpectedly.')
}

export async function makeFilePublic(fileId: string, accessToken: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'anyone', role: 'reader' }),
  })
  if (!response.ok) await throwDriveApiError(response, 'Upload succeeded, but link sharing could not be enabled')
}
