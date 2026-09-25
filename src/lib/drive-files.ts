import { driveJson } from '@/lib/drive-api'

export const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder'
export const FLASHUPLOAD_ROOT_NAME = 'FlashUpload'

export type DriveItem = {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
  createdTime?: string
  webViewLink?: string
  iconLink?: string
  thumbnailLink?: string
  parents?: string[]
  trashed?: boolean
  starred?: boolean
  description?: string
}

export type DriveListResponse = {
  files: DriveItem[]
  nextPageToken?: string
}

const ITEM_FIELDS = 'id,name,mimeType,size,modifiedTime,createdTime,webViewLink,iconLink,thumbnailLink,parents,trashed,starred,description'

export function isDriveFolder(item: Pick<DriveItem, 'mimeType'>) {
  return item.mimeType === DRIVE_FOLDER_MIME
}

export function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

async function listDriveByClauses(
  accessToken: string,
  clauses: string[],
  options: { search?: string; pageToken?: string; pageSize?: number; orderBy?: string } = {},
  action = 'Could not list Drive files',
) {
  const search = options.search?.trim()
  if (search) clauses.push(`name contains '${escapeDriveQueryValue(search)}'`)

  const params = new URLSearchParams({
    q: clauses.join(' and '),
    pageSize: String(Math.min(1000, Math.max(1, options.pageSize ?? 200))),
    orderBy: options.orderBy ?? 'folder,name_natural',
    fields: `nextPageToken,files(${ITEM_FIELDS})`,
    spaces: 'drive',
  })
  if (options.pageToken) params.set('pageToken', options.pageToken)

  return driveJson<DriveListResponse>(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    accessToken,
    undefined,
    action,
  )
}

export async function listDriveItems(
  accessToken: string,
  options: {
    parentId?: string | null
    search?: string
    pageToken?: string
    pageSize?: number
    orderBy?: string
    trashed?: boolean
  } = {},
) {
  const clauses = [`trashed = ${options.trashed ? 'true' : 'false'}`]
  const parentId = options.parentId === undefined ? 'root' : options.parentId
  if (parentId) clauses.unshift(`'${escapeDriveQueryValue(parentId)}' in parents`)
  return listDriveByClauses(accessToken, clauses, options)
}

export async function listDriveFolders(accessToken: string) {
  return listDriveByClauses(
    accessToken,
    [`mimeType = '${DRIVE_FOLDER_MIME}'`, 'trashed = false'],
    { pageSize: 1000, orderBy: 'name_natural' },
    'Could not list Drive folders',
  )
}

export async function listDriveTrash(accessToken: string) {
  return listDriveByClauses(
    accessToken,
    ['trashed = true'],
    { pageSize: 500, orderBy: 'modifiedTime desc' },
    'Could not list Drive trash',
  )
}

export async function getDriveItem(fileId: string, accessToken: string) {
  const params = new URLSearchParams({ fields: ITEM_FIELDS })
  return driveJson<DriveItem>(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${params}`,
    accessToken,
    undefined,
    'Could not load the Drive item',
  )
}

export async function createDriveFolder(name: string, parentId: string, accessToken: string) {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Folder name cannot be empty.')
  const params = new URLSearchParams({ fields: ITEM_FIELDS })
  return driveJson<DriveItem>(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed, mimeType: DRIVE_FOLDER_MIME, parents: [parentId] }),
    },
    'Could not create the Drive folder',
  )
}

export async function ensureFlashUploadRoot(accessToken: string) {
  const response = await listDriveItems(accessToken, { parentId: 'root', search: FLASHUPLOAD_ROOT_NAME, pageSize: 100 })
  const existing = response.files.find((item) => item.name === FLASHUPLOAD_ROOT_NAME && isDriveFolder(item))
  if (existing) return existing
  return createDriveFolder(FLASHUPLOAD_ROOT_NAME, 'root', accessToken)
}

export async function renameDriveItem(fileId: string, name: string, accessToken: string) {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Name cannot be empty.')
  const params = new URLSearchParams({ fields: ITEM_FIELDS })
  return driveJson<DriveItem>(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${params}`,
    accessToken,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    },
    'Could not rename the Drive item',
  )
}

export async function moveDriveItem(fileId: string, destinationFolderId: string, accessToken: string) {
  const current = await getDriveItem(fileId, accessToken)
  const currentParents = current.parents ?? []
  if (currentParents.includes(destinationFolderId) && currentParents.length === 1) return current

  const params = new URLSearchParams({
    addParents: destinationFolderId,
    fields: ITEM_FIELDS,
  })
  if (currentParents.length) params.set('removeParents', currentParents.join(','))

  return driveJson<DriveItem>(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${params}`,
    accessToken,
    { method: 'PATCH' },
    'Could not move the Drive item',
  )
}

export async function setDriveItemTrashed(fileId: string, trashed: boolean, accessToken: string) {
  const params = new URLSearchParams({ fields: ITEM_FIELDS })
  return driveJson<DriveItem>(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${params}`,
    accessToken,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trashed }),
    },
    trashed ? 'Could not move the Drive item to trash' : 'Could not restore the Drive item',
  )
}

export async function trashDriveItem(fileId: string, accessToken: string) {
  return setDriveItemTrashed(fileId, true, accessToken)
}

export async function restoreDriveItem(fileId: string, accessToken: string) {
  return setDriveItemTrashed(fileId, false, accessToken)
}

export async function deleteDriveItemPermanently(fileId: string, accessToken: string) {
  return driveJson<void>(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    accessToken,
    { method: 'DELETE' },
    'Could not permanently delete the Drive item',
  )
}
