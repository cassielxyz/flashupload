import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deleteUploadSession, listUploadSessions, saveUploadSession } from '@/lib/session-db'
import { makeFilePublic, uploadFileToDrive, type DriveFile } from '@/lib/drive-upload'

export type UploadStatus = 'queued' | 'preparing' | 'uploading' | 'paused' | 'complete' | 'error' | 'canceled'

export type UploadTask = {
  id: string
  file: File
  status: UploadStatus
  uploadedBytes: number
  speedBytesPerSecond: number
  etaSeconds: number
  chunkSize: number
  parentId?: string
  error?: string
  result?: DriveFile
}

type Runtime = { controller?: AbortController; sessionUrl?: string; uploadedBytes: number }
type Options = {
  getAccessToken: () => Promise<string | null>
  concurrency?: number
  shareAfterUpload?: boolean
  destinationFolderId?: string
}

function fingerprint(file: File) { return `${file.name}:${file.size}:${file.lastModified}` }

export function useUploadManager({ getAccessToken, concurrency = 2, shareAfterUpload = false, destinationFolderId }: Options) {
  const [tasks, setTasks] = useState<UploadTask[]>([])
  const runtimes = useRef(new Map<string, Runtime>())
  const running = useRef(new Set<string>())
  const paused = useRef(new Set<string>())
  const canceled = useRef(new Set<string>())
  const settingsRef = useRef({ concurrency, shareAfterUpload, destinationFolderId })

  useEffect(() => { settingsRef.current = { concurrency, shareAfterUpload, destinationFolderId } }, [concurrency, shareAfterUpload, destinationFolderId])

  const patchTask = useCallback((id: string, patch: Partial<UploadTask>) => {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...patch } : task)))
  }, [])

  const addFiles = useCallback((files: File[] | FileList) => {
    const incoming = Array.from(files)
    void (async () => {
      const saved = await listUploadSessions().catch(() => [])
      setTasks((current) => {
        const existing = new Set(current.filter((item) => item.status !== 'canceled').map((item) => fingerprint(item.file)))
        const additions = incoming.filter((file) => file.size > 0 && !existing.has(fingerprint(file))).map<UploadTask>((file) => {
          const previous = saved.find((session) => session.name === file.name && session.size === file.size && session.lastModified === file.lastModified && Date.now() - session.savedAt < 7 * 24 * 60 * 60 * 1000)
          const id = previous?.id ?? crypto.randomUUID()
          const parentId = previous?.parentId ?? settingsRef.current.destinationFolderId
          runtimes.current.set(id, { uploadedBytes: previous?.uploadedBytes ?? 0, sessionUrl: previous?.sessionUrl })
          existing.add(fingerprint(file))
          return { id, file, status: 'queued', uploadedBytes: previous?.uploadedBytes ?? 0, speedBytesPerSecond: 0, etaSeconds: Infinity, chunkSize: 8 * 1024 * 1024, parentId }
        })
        return [...additions, ...current]
      })
    })()
  }, [])

  const runTask = useCallback(async (task: UploadTask) => {
    if (running.current.has(task.id)) return
    running.current.add(task.id)
    paused.current.delete(task.id)
    canceled.current.delete(task.id)

    const runtime = runtimes.current.get(task.id) ?? { uploadedBytes: task.uploadedBytes }
    const controller = new AbortController()
    runtime.controller = controller
    runtimes.current.set(task.id, runtime)
    patchTask(task.id, { status: 'preparing', error: undefined })

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error('Reconnect Google Drive to continue uploading.')
      patchTask(task.id, { status: 'uploading' })

      const result = await uploadFileToDrive(task.file, {
        accessToken,
        signal: controller.signal,
        previousSessionUrl: runtime.sessionUrl,
        previousUploadedBytes: runtime.uploadedBytes,
        parentId: task.parentId,
        onSession: (sessionUrl) => {
          runtime.sessionUrl = sessionUrl
          void saveUploadSession({ id: task.id, name: task.file.name, size: task.file.size, type: task.file.type, lastModified: task.file.lastModified, sessionUrl, uploadedBytes: runtime.uploadedBytes, savedAt: Date.now(), parentId: task.parentId }).catch(() => undefined)
        },
        onProgress: (progress) => {
          runtime.uploadedBytes = progress.uploadedBytes
          patchTask(task.id, { status: 'uploading', uploadedBytes: progress.uploadedBytes, speedBytesPerSecond: progress.speedBytesPerSecond, etaSeconds: progress.etaSeconds, chunkSize: progress.chunkSize })
          if (runtime.sessionUrl) {
            void saveUploadSession({ id: task.id, name: task.file.name, size: task.file.size, type: task.file.type, lastModified: task.file.lastModified, sessionUrl: runtime.sessionUrl, uploadedBytes: progress.uploadedBytes, savedAt: Date.now(), parentId: task.parentId }).catch(() => undefined)
          }
        },
      })

      let warning: string | undefined
      if (settingsRef.current.shareAfterUpload) {
        const freshToken = await getAccessToken()
        if (!freshToken) warning = 'Upload finished. Reconnect Google to enable public link sharing.'
        else {
          try { await makeFilePublic(result.id, freshToken) }
          catch (cause) { warning = cause instanceof Error ? cause.message : 'Link sharing could not be enabled.' }
        }
      }

      runtime.uploadedBytes = task.file.size
      patchTask(task.id, { status: warning ? 'error' : 'complete', uploadedBytes: task.file.size, etaSeconds: 0, result, error: warning })
      await deleteUploadSession(task.id).catch(() => undefined)
    } catch (cause) {
      if (controller.signal.aborted) {
        if (canceled.current.has(task.id)) patchTask(task.id, { status: 'canceled' })
        else patchTask(task.id, { status: 'paused' })
      } else {
        const message = cause instanceof Error ? cause.message : 'Upload failed.'
        if (message.includes('expired')) { runtime.sessionUrl = undefined; runtime.uploadedBytes = 0 }
        patchTask(task.id, { status: 'error', error: message })
      }
    } finally {
      runtime.controller = undefined
      running.current.delete(task.id)
      setTasks((current) => [...current])
    }
  }, [getAccessToken, patchTask])

  useEffect(() => {
    const active = running.current.size
    if (active >= concurrency) return
    const next = tasks.filter((task) => task.status === 'queued' && !running.current.has(task.id)).slice(0, concurrency - active)
    next.forEach((task) => void runTask(task))
  }, [tasks, concurrency, runTask])

  const pause = useCallback((id: string) => { paused.current.add(id); patchTask(id, { status: 'paused' }); runtimes.current.get(id)?.controller?.abort() }, [patchTask])
  const resume = useCallback((id: string) => { paused.current.delete(id); canceled.current.delete(id); patchTask(id, { status: 'queued', error: undefined }) }, [patchTask])
  const cancel = useCallback((id: string) => { canceled.current.add(id); paused.current.delete(id); runtimes.current.get(id)?.controller?.abort(); patchTask(id, { status: 'canceled' }); void deleteUploadSession(id).catch(() => undefined) }, [patchTask])
  const retry = useCallback((id: string) => { canceled.current.delete(id); paused.current.delete(id); patchTask(id, { status: 'queued', error: undefined }) }, [patchTask])
  const clearFinished = useCallback(() => { setTasks((current) => current.filter((task) => !['complete', 'canceled'].includes(task.status))) }, [])

  const stats = useMemo(() => {
    const totalBytes = tasks.reduce((sum, task) => sum + task.file.size, 0)
    const uploadedBytes = tasks.reduce((sum, task) => sum + Math.min(task.uploadedBytes, task.file.size), 0)
    const speed = tasks.filter((task) => task.status === 'uploading').reduce((sum, task) => sum + task.speedBytesPerSecond, 0)
    const active = tasks.filter((task) => ['preparing', 'uploading'].includes(task.status)).length
    return { totalBytes, uploadedBytes, speed, active }
  }, [tasks])

  useEffect(() => {
    const hasUnfinished = tasks.some((task) => ['queued', 'preparing', 'uploading', 'paused'].includes(task.status))
    if (!hasUnfinished) return
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [tasks])

  useEffect(() => {
    if (!stats.active || !('wakeLock' in navigator)) return
    let lock: { release: () => Promise<void> } | undefined
    const request = async () => {
      try {
        lock = await (navigator as Navigator & { wakeLock: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock.request('screen')
      } catch { /* progressive enhancement only */ }
    }
    void request()
    return () => { void lock?.release() }
  }, [stats.active])

  return { tasks, stats, addFiles, pause, resume, cancel, retry, clearFinished }
}
