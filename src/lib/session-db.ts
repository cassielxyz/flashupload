export type SavedUploadSession = {
  id: string
  name: string
  size: number
  type: string
  lastModified: number
  sessionUrl: string
  uploadedBytes: number
  savedAt: number
  parentId?: string
}

const DB_NAME = 'flashupload'
const STORE_NAME = 'sessions'

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveUploadSession(session: SavedUploadSession) {
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(session)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function deleteUploadSession(id: string) {
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function listUploadSessions() {
  const db = await openDb()
  return new Promise<SavedUploadSession[]>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result as SavedUploadSession[])
    request.onerror = () => reject(request.error)
  })
}
