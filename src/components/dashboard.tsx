import { useEffect, useMemo, useRef, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Copy,
  ExternalLink,
  File,
  Folder,
  FolderPlus,
  Gauge,
  Grid2X2,
  HelpCircle,
  List,
  LogOut,
  Menu,
  MoreVertical,
  Move,
  Pencil,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Undo2,
  Upload,
  UploadCloud,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { UploadDropzone } from '@/components/upload-dropzone'
import { UploadItem } from '@/components/upload-item'
import { Button } from '@/components/ui/button'
import type { GoogleProfile } from '@/lib/google-auth'
import type { Theme } from '@/hooks/use-theme'
import { useUploadManager } from '@/hooks/use-upload-manager'
import {
  createDriveFolder,
  deleteDriveItemPermanently,
  ensureFlashUploadRoot,
  isDriveFolder,
  listDriveFolders,
  listDriveItems,
  listDriveTrash,
  moveDriveItem,
  renameDriveItem,
  restoreDriveItem,
  trashDriveItem,
  type DriveItem,
} from '@/lib/drive-files'
import { formatBytes, formatSpeed } from '@/lib/utils'

type WorkspaceView = 'files' | 'transfers' | 'trash' | 'settings' | 'help'
type ViewMode = 'list' | 'grid'
type SortKey = 'name' | 'modified' | 'size'
type TextDialog = { kind: 'create' | 'rename'; item?: DriveItem } | null

export function Dashboard({
  profile,
  theme,
  onToggleTheme,
  ensureToken,
  onDisconnect,
}: {
  profile: GoogleProfile
  theme: Theme
  onToggleTheme: () => void
  ensureToken: () => Promise<string | null>
  onDisconnect: () => Promise<void>
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<WorkspaceView>('files')
  const [shareAfterUpload, setShareAfterUpload] = useState(false)
  const [concurrency, setConcurrency] = useState(2)
  const [query, setQuery] = useState('')
  const [rootFolder, setRootFolder] = useState<DriveItem | null>(null)
  const [folderStack, setFolderStack] = useState<DriveItem[]>([])
  const [items, setItems] = useState<DriveItem[]>([])
  const [trashItems, setTrashItems] = useState<DriveItem[]>([])
  const [workspaceLoading, setWorkspaceLoading] = useState(true)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [selected, setSelected] = useState<DriveItem | null>(null)
  const [textDialog, setTextDialog] = useState<TextDialog>(null)
  const [dialogValue, setDialogValue] = useState('')
  const [moveItem, setMoveItem] = useState<DriveItem | null>(null)
  const [moveFolders, setMoveFolders] = useState<DriveItem[]>([])
  const [moveLoading, setMoveLoading] = useState(false)
  const [confirmTrash, setConfirmTrash] = useState<DriveItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<DriveItem | null>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const online = useOnlineStatus()
  const currentFolder = folderStack.at(-1) ?? rootFolder
  const currentFolderId = currentFolder?.id
  const manager = useUploadManager({ getAccessToken: ensureToken, concurrency, shareAfterUpload, destinationFolderId: currentFolderId })
  const completed = manager.tasks.filter((task) => Boolean(task.result)).length

  const visibleTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return normalized && view === 'transfers' ? manager.tasks.filter((task) => task.file.name.toLowerCase().includes(normalized)) : manager.tasks
  }, [manager.tasks, query, view])

  const sortedItems = useMemo(() => {
    const copy = [...items]
    copy.sort((a, b) => {
      const folderDelta = Number(isDriveFolder(b)) - Number(isDriveFolder(a))
      if (folderDelta) return folderDelta
      if (sortKey === 'modified') return Date.parse(b.modifiedTime ?? '0') - Date.parse(a.modifiedTime ?? '0')
      if (sortKey === 'size') return Number(b.size ?? 0) - Number(a.size ?? 0)
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    })
    return copy
  }, [items, sortKey])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setWorkspaceLoading(true)
      setWorkspaceError(null)
      try {
        const token = await ensureToken()
        if (!token) throw new Error('Reconnect Google Drive to open the workspace.')
        const root = await ensureFlashUploadRoot(token)
        if (!cancelled) {
          setRootFolder(root)
          setFolderStack([root])
        }
      } catch (cause) {
        if (!cancelled) setWorkspaceError(cause instanceof Error ? cause.message : 'Could not initialize the Drive workspace.')
      } finally {
        if (!cancelled) setWorkspaceLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [ensureToken])

  useEffect(() => {
    if (!currentFolderId || view !== 'files') return
    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        setWorkspaceLoading(true)
        setWorkspaceError(null)
        try {
          const token = await ensureToken()
          if (!token) throw new Error('Reconnect Google Drive to refresh files.')
          const response = await listDriveItems(token, { parentId: currentFolderId, search: query.trim() || undefined })
          if (!cancelled) {
            setItems(response.files)
            setSelected((current) => current && response.files.some((item) => item.id === current.id) ? current : null)
          }
        } catch (cause) {
          if (!cancelled) setWorkspaceError(cause instanceof Error ? cause.message : 'Could not load Drive files.')
        } finally {
          if (!cancelled) setWorkspaceLoading(false)
        }
      })()
    }, query ? 220 : 0)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [currentFolderId, ensureToken, query, refreshKey, view])

  useEffect(() => {
    if (view !== 'trash') return
    let cancelled = false
    void (async () => {
      setWorkspaceLoading(true)
      setWorkspaceError(null)
      try {
        const token = await ensureToken()
        if (!token) throw new Error('Reconnect Google Drive to load trash.')
        const response = await listDriveTrash(token)
        if (!cancelled) setTrashItems(response.files)
      } catch (cause) {
        if (!cancelled) setWorkspaceError(cause instanceof Error ? cause.message : 'Could not load Drive trash.')
      } finally {
        if (!cancelled) setWorkspaceLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [ensureToken, refreshKey, view])

  const completedSignature = manager.tasks.filter((task) => task.status === 'complete' && task.result).map((task) => task.result!.id).join(',')
  useEffect(() => {
    if (completedSignature) setRefreshKey((value) => value + 1)
  }, [completedSignature])

  const changeView = (next: WorkspaceView) => {
    setView(next)
    setQuery('')
    setSidebarOpen(false)
    setWorkspaceError(null)
  }

  const openFolder = (folder: DriveItem) => {
    if (!isDriveFolder(folder)) return
    setFolderStack((current) => [...current, folder])
    setSelected(null)
    setQuery('')
  }

  const goToBreadcrumb = (index: number) => {
    setFolderStack((current) => current.slice(0, index + 1))
    setSelected(null)
    setQuery('')
  }

  const openCreateFolder = () => {
    setDialogValue('')
    setTextDialog({ kind: 'create' })
  }

  const openRename = (item: DriveItem) => {
    setDialogValue(item.name)
    setTextDialog({ kind: 'rename', item })
  }

  const submitTextDialog = async () => {
    if (!textDialog || !currentFolderId || !dialogValue.trim()) return
    try {
      const token = await ensureToken()
      if (!token) throw new Error('Reconnect Google Drive to continue.')
      if (textDialog.kind === 'create') {
        await createDriveFolder(dialogValue, currentFolderId, token)
        toast.success('Folder created')
      } else if (textDialog.item) {
        await renameDriveItem(textDialog.item.id, dialogValue, token)
        toast.success('Item renamed')
      }
      setTextDialog(null)
      setRefreshKey((value) => value + 1)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Drive action failed.')
    }
  }

  const openMove = async (item: DriveItem) => {
    setMoveItem(item)
    setMoveLoading(true)
    try {
      const token = await ensureToken()
      if (!token) throw new Error('Reconnect Google Drive to continue.')
      const response = await listDriveFolders(token)
      setMoveFolders(response.files.filter((folder) => folder.id !== item.id))
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not load folders.')
      setMoveItem(null)
    } finally {
      setMoveLoading(false)
    }
  }

  const submitMove = async (folderId: string) => {
    if (!moveItem) return
    try {
      const token = await ensureToken()
      if (!token) throw new Error('Reconnect Google Drive to continue.')
      await moveDriveItem(moveItem.id, folderId, token)
      toast.success('Item moved')
      setMoveItem(null)
      setRefreshKey((value) => value + 1)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not move the item.')
    }
  }

  const trashSelected = async () => {
    if (!confirmTrash) return
    try {
      const token = await ensureToken()
      if (!token) throw new Error('Reconnect Google Drive to continue.')
      await trashDriveItem(confirmTrash.id, token)
      toast.success('Moved to trash')
      setConfirmTrash(null)
      setSelected(null)
      setRefreshKey((value) => value + 1)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not move the item to trash.')
    }
  }

  const restoreItem = async (item: DriveItem) => {
    try {
      const token = await ensureToken()
      if (!token) throw new Error('Reconnect Google Drive to continue.')
      await restoreDriveItem(item.id, token)
      toast.success('Item restored')
      setRefreshKey((value) => value + 1)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not restore the item.')
    }
  }

  const deletePermanently = async () => {
    if (!confirmDelete) return
    try {
      const token = await ensureToken()
      if (!token) throw new Error('Reconnect Google Drive to continue.')
      await deleteDriveItemPermanently(confirmDelete.id, token)
      toast.success('Item permanently deleted')
      setConfirmDelete(null)
      setRefreshKey((value) => value + 1)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not permanently delete the item.')
    }
  }

  const copyDriveLink = async (item: DriveItem) => {
    if (!item.webViewLink) return toast.error('Google Drive did not provide a view link for this item.')
    await navigator.clipboard.writeText(item.webViewLink)
    toast.success('Drive link copied')
  }

  const searchPlaceholder = view === 'files' ? 'Search this folder' : view === 'transfers' ? 'Search transfer queue' : 'Search is available in files and transfers'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 signal-grid opacity-[0.32] dark:opacity-[0.2]" />

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1700px] items-center px-3 sm:px-5 lg:px-6">
          <Button variant="ghost" size="icon" className="mr-1 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></Button>
          <Brand />
          <span className="ml-3 hidden rounded-full border border-border/70 bg-secondary/55 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground sm:inline">drive workspace</span>

          <div className="mx-auto hidden w-full max-w-2xl px-10 md:block">
            <div className="flex h-10 items-center gap-3 rounded-full border border-transparent bg-secondary/65 px-4 transition focus-within:border-primary/20 focus-within:bg-background focus-within:ring-4 focus-within:ring-primary/[0.06]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} disabled={!['files', 'transfers'].includes(view)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed" placeholder={searchPlaceholder} />
              {query && <button onClick={() => setQuery('')} className="rounded-full p-1 text-muted-foreground hover:bg-secondary" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <span className="mr-1 hidden items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[10px] text-muted-foreground sm:inline-flex">
              {online ? <Wifi className="h-3 w-3 text-emerald-500" /> : <WifiOff className="h-3 w-3 text-destructive" />}
              {online ? 'network online' : 'offline'}
            </span>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <AccountMenu profile={profile} onDisconnect={onDisconnect} />
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex max-w-[1700px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[248px] shrink-0 border-r border-border/65 bg-background/62 px-3 py-5 backdrop-blur lg:block">
          <Sidebar view={view} onChange={changeView} completed={completed} active={manager.stats.active} />
          <div className="absolute inset-x-3 bottom-5 rounded-2xl border border-border/70 bg-card/65 p-3.5">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">workspace scope</p>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> FlashUpload folder</div>
            <p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">Uses the narrow Google <code>drive.file</code> scope.</p>
          </div>
        </aside>

        <AnimatePresence>{sidebarOpen && <MobileSidebar onClose={() => setSidebarOpen(false)} view={view} onChange={changeView} completed={completed} active={manager.stats.active} />}</AnimatePresence>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[1280px]">
            {workspaceError && (
              <div className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/[0.055] px-4 py-3 text-sm leading-6 text-destructive">
                <strong>Google Drive needs attention.</strong> {workspaceError}
              </div>
            )}

            {view === 'files' && (
              <FilesView
                rootFolder={rootFolder}
                folderStack={folderStack}
                items={sortedItems}
                loading={workspaceLoading}
                selected={selected}
                currentFolder={currentFolder}
                viewMode={viewMode}
                sortKey={sortKey}
                uploadInputRef={uploadInputRef}
                onFiles={manager.addFiles}
                onOpenFolder={openFolder}
                onBreadcrumb={goToBreadcrumb}
                onCreateFolder={openCreateFolder}
                onRefresh={() => setRefreshKey((value) => value + 1)}
                onSelect={setSelected}
                onRename={openRename}
                onMove={openMove}
                onTrash={setConfirmTrash}
                onCopyLink={(item) => void copyDriveLink(item)}
                onViewMode={setViewMode}
                onSort={setSortKey}
              />
            )}

            {view === 'transfers' && (
              <TransfersView manager={manager} visibleTasks={visibleTasks} completed={completed} query={query} />
            )}

            {view === 'trash' && (
              <TrashView items={trashItems} loading={workspaceLoading} onRestore={(item) => void restoreItem(item)} onDelete={setConfirmDelete} />
            )}

            {view === 'settings' && (
              <SettingsView concurrency={concurrency} shareAfterUpload={shareAfterUpload} onConcurrency={setConcurrency} onShare={setShareAfterUpload} theme={theme} onToggleTheme={onToggleTheme} />
            )}

            {view === 'help' && <HelpView />}
          </div>
        </main>
      </div>

      <TextDialogModal dialog={textDialog} value={dialogValue} onValue={setDialogValue} onClose={() => setTextDialog(null)} onSubmit={() => void submitTextDialog()} />
      <MoveModal item={moveItem} folders={moveFolders} loading={moveLoading} rootFolder={rootFolder} onClose={() => setMoveItem(null)} onMove={(folderId) => void submitMove(folderId)} />
      <ConfirmModal open={Boolean(confirmTrash)} title="Move to trash?" text={confirmTrash ? `${confirmTrash.name} will be moved to Google Drive trash.` : ''} confirmLabel="Move to trash" onClose={() => setConfirmTrash(null)} onConfirm={() => void trashSelected()} />
      <ConfirmModal open={Boolean(confirmDelete)} title="Delete permanently?" text={confirmDelete ? `${confirmDelete.name} will be permanently deleted from Google Drive. This cannot be undone.` : ''} confirmLabel="Delete permanently" danger onClose={() => setConfirmDelete(null)} onConfirm={() => void deletePermanently()} />
    </div>
  )
}

function FilesView({
  folderStack,
  items,
  loading,
  selected,
  currentFolder,
  viewMode,
  sortKey,
  uploadInputRef,
  onFiles,
  onOpenFolder,
  onBreadcrumb,
  onCreateFolder,
  onRefresh,
  onSelect,
  onRename,
  onMove,
  onTrash,
  onCopyLink,
  onViewMode,
  onSort,
}: {
  rootFolder: DriveItem | null
  folderStack: DriveItem[]
  items: DriveItem[]
  loading: boolean
  selected: DriveItem | null
  currentFolder: DriveItem | null
  viewMode: ViewMode
  sortKey: SortKey
  uploadInputRef: React.RefObject<HTMLInputElement>
  onFiles: (files: File[]) => void
  onOpenFolder: (folder: DriveItem) => void
  onBreadcrumb: (index: number) => void
  onCreateFolder: () => void
  onRefresh: () => void
  onSelect: (item: DriveItem | null) => void
  onRename: (item: DriveItem) => void
  onMove: (item: DriveItem) => void
  onTrash: (item: DriveItem) => void
  onCopyLink: (item: DriveItem) => void
  onViewMode: (mode: ViewMode) => void
  onSort: (sort: SortKey) => void
}) {
  return (
    <>
      <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {folderStack.map((folder, index) => (
              <span key={folder.id} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="h-3 w-3" />}
                <button onClick={() => onBreadcrumb(index)} className={`rounded-md px-1.5 py-1 transition hover:bg-secondary hover:text-foreground ${index === folderStack.length - 1 ? 'font-semibold text-foreground' : ''}`}>{index === 0 ? 'FlashUpload' : folder.name}</button>
              </span>
            ))}
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-[2.75rem]">{currentFolder?.name ?? 'My files'}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A Drive-backed workspace for files created through FlashUpload. Uploads in this view are stored in the current folder.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onCreateFolder}><FolderPlus className="h-4 w-4" /> New folder</Button>
          <Button onClick={() => uploadInputRef.current?.click()}><Upload className="h-4 w-4" /> Upload</Button>
          <input ref={uploadInputRef} type="file" multiple className="sr-only" onChange={(event) => event.target.files && onFiles(Array.from(event.target.files))} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 p-2.5">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onRefresh}><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh</Button>
          <select value={sortKey} onChange={(event) => onSort(event.target.value as SortKey)} className="h-8 rounded-full border border-border bg-background px-3 text-xs outline-none">
            <option value="name">Name</option>
            <option value="modified">Modified</option>
            <option value="size">Size</option>
          </select>
        </div>
        <div className="flex rounded-full border border-border bg-background p-0.5">
          <button onClick={() => onViewMode('list')} className={`grid h-7 w-8 place-items-center rounded-full ${viewMode === 'list' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`} aria-label="List view"><List className="h-3.5 w-3.5" /></button>
          <button onClick={() => onViewMode('grid')} className={`grid h-7 w-8 place-items-center rounded-full ${viewMode === 'grid' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`} aria-label="Grid view"><Grid2X2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          {loading && !items.length ? <WorkspaceLoading /> : items.length ? (
            viewMode === 'list' ? (
              <div className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/70">
                <div className="grid grid-cols-[minmax(0,1fr)_120px_100px_46px] border-b border-border/70 px-4 py-2.5 font-mono text-[8px] uppercase tracking-[0.13em] text-muted-foreground sm:px-5"><span>Name</span><span className="hidden sm:block">Modified</span><span className="hidden sm:block">Size</span><span /></div>
                {items.map((item) => <DriveRow key={item.id} item={item} selected={selected?.id === item.id} onSelect={() => onSelect(item)} onOpenFolder={() => onOpenFolder(item)} onRename={() => onRename(item)} onMove={() => onMove(item)} onTrash={() => onTrash(item)} onCopyLink={() => onCopyLink(item)} />)}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => <DriveCard key={item.id} item={item} selected={selected?.id === item.id} onSelect={() => onSelect(item)} onOpenFolder={() => onOpenFolder(item)} onRename={() => onRename(item)} onMove={() => onMove(item)} onTrash={() => onTrash(item)} onCopyLink={() => onCopyLink(item)} />)}
              </div>
            )
          ) : <EmptyFiles onCreateFolder={onCreateFolder} onUpload={() => uploadInputRef.current?.click()} />}
        </section>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <DetailsPanel item={selected} />
        </aside>
      </div>
    </>
  )
}

function TransfersView({ manager, visibleTasks, completed, query }: { manager: ReturnType<typeof useUploadManager>; visibleTasks: ReturnType<typeof useUploadManager>['tasks']; completed: number; query: string }) {
  return (
    <>
      <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">browser → drive / resumable</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-[2.75rem]">Transfers</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Pause, retry, and resume large files without routing payload bytes through FlashUpload servers.</p></div>
        <div className="flex items-center gap-2 self-start rounded-full border border-emerald-500/20 bg-emerald-500/[0.055] px-3 py-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> direct browser route</div>
      </div>
      <UploadDropzone onFiles={manager.addFiles} />
      <div className="mt-5 overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/68 backdrop-blur"><div className="grid divide-y divide-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0"><Metric icon={UploadCloud} label="transferred" value={formatBytes(manager.stats.uploadedBytes)} sub={manager.stats.totalBytes ? `of ${formatBytes(manager.stats.totalBytes)}` : 'waiting for files'} /><Metric icon={Gauge} label="combined speed" value={manager.stats.speed > 0 ? formatSpeed(manager.stats.speed) : '—'} sub={`${manager.stats.active} active transfer${manager.stats.active === 1 ? '' : 's'}`} /><Metric icon={CheckCircle2} label="completed" value={String(completed).padStart(2, '0')} sub={`${manager.tasks.length} file${manager.tasks.length === 1 ? '' : 's'} this session`} /></div></div>
      <div className="mt-8"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">queue / adaptive resumable</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.02em]">Transfer queue</h2></div>{manager.tasks.some((task) => ['complete', 'canceled'].includes(task.status)) && <Button variant="ghost" size="sm" onClick={manager.clearFinished}>Clear finished</Button>}</div><div className="space-y-3">{visibleTasks.length ? visibleTasks.map((task) => <UploadItem key={task.id} task={task} onPause={() => manager.pause(task.id)} onResume={() => manager.resume(task.id)} onCancel={() => manager.cancel(task.id)} onRetry={() => manager.retry(task.id)} />) : <EmptyQueue query={query} />}</div></div>
    </>
  )
}

function TrashView({ items, loading, onRestore, onDelete }: { items: DriveItem[]; loading: boolean; onRestore: (item: DriveItem) => void; onDelete: (item: DriveItem) => void }) {
  return (
    <><div className="mb-7"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">google drive / trash</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-[2.75rem]">Trash</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Restore items or permanently delete them from Google Drive.</p></div>{loading && !items.length ? <WorkspaceLoading /> : items.length ? <div className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/70">{items.map((item) => <div key={item.id} className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0"><ItemIcon item={item} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{formatItemMeta(item)}</p></div><Button variant="ghost" size="sm" onClick={() => onRestore(item)}><Undo2 className="h-3.5 w-3.5" /> Restore</Button><Button variant="danger" size="sm" onClick={() => onDelete(item)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button></div>)}</div> : <div className="rounded-[1.35rem] border border-dashed border-border bg-card/45 px-6 py-16 text-center"><Trash2 className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-4 text-sm font-semibold">Trash is empty</p></div>}</>
  )
}

function SettingsView({ concurrency, shareAfterUpload, onConcurrency, onShare, theme, onToggleTheme }: { concurrency: number; shareAfterUpload: boolean; onConcurrency: (value: number) => void; onShare: (value: boolean) => void; theme: Theme; onToggleTheme: () => void }) {
  return (
    <><div className="mb-7"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">workspace / preferences</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-[2.75rem]">Settings</h1></div><div className="grid gap-4 lg:grid-cols-2"><SettingCard title="Transfer engine" icon={SlidersHorizontal}><div className="space-y-6"><div><div className="flex items-center justify-between text-sm"><span>Parallel files</span><span className="rounded-md bg-secondary px-2 py-1 font-mono text-xs">{concurrency}</span></div><input type="range" min={1} max={3} step={1} value={concurrency} onChange={(event) => onConcurrency(Number(event.target.value))} className="mt-4 w-full accent-[hsl(var(--primary))]" /><p className="mt-2 text-xs leading-5 text-muted-foreground">Separate files may upload in parallel; chunks within one file remain ordered.</p></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-background/50 p-3"><input type="checkbox" checked={shareAfterUpload} onChange={(event) => onShare(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" /><span><span className="block text-sm font-semibold">Anyone-with-link after upload</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Off by default. When enabled, FlashUpload creates a public read permission after the file finishes.</span></span></label></div></SettingCard><SettingCard title="Appearance & privacy" icon={ShieldCheck}><div className="flex items-center justify-between rounded-xl border border-border/70 p-3"><div><p className="text-sm font-semibold">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p><p className="mt-1 text-xs text-muted-foreground">Light mode is the default.</p></div><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div><div className="mt-4 rounded-xl bg-secondary/55 p-3 text-xs leading-5 text-muted-foreground">FlashUpload requests <code>drive.file</code>, so this workspace manages files and folders created by or explicitly granted to FlashUpload instead of silently reading your entire Drive.</div></SettingCard></div></>
  )
}

function HelpView() {
  return (
    <><div className="mb-7"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">docs / product behavior</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-[2.75rem]">How it works</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">The short version of FlashUpload's transfer and Drive workspace model.</p></div><div className="grid gap-4 md:grid-cols-3"><HelpCard index="01" title="App-owned Drive workspace" text="FlashUpload creates a normal FlashUpload folder in your Google Drive and manages files under the narrow drive.file permission." /><HelpCard index="02" title="Resumable upload sessions" text="Large files are sliced into Drive-compatible chunks. Google confirms the accepted byte range so an interruption can continue instead of restarting." /><HelpCard index="03" title="Useful error diagnostics" text="Drive API failures show Google's reason and message. A 403 can mean the Drive API is disabled, the token lacks scope, or an account policy blocked the operation." /></div><div className="mt-5 rounded-[1.35rem] border border-border/70 bg-card/70 p-5"><h2 className="text-lg font-semibold">If an upload shows 403</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Use the exact error shown by FlashUpload. If it says the Drive API is disabled, enable Google Drive API in the same Cloud project as the OAuth client. If it says the access token has insufficient scope, disconnect Google and reconnect so the <code>drive.file</code> consent is granted.</p></div></>
  )
}

function Sidebar({ view, onChange, completed, active }: { view: WorkspaceView; onChange: (view: WorkspaceView) => void; completed: number; active: number }) {
  const items: Array<{ icon: typeof Activity; label: string; view: WorkspaceView; count?: number }> = [
    { icon: Folder, label: 'My files', view: 'files' },
    { icon: Activity, label: 'Transfers', view: 'transfers', count: active || completed || undefined },
    { icon: Trash2, label: 'Trash', view: 'trash' },
    { icon: Settings2, label: 'Settings', view: 'settings' },
    { icon: HelpCircle, label: 'How it works', view: 'help' },
  ]
  return <nav><p className="mb-3 px-3 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">workspace</p><div className="space-y-1">{items.map((item) => <button key={item.view} onClick={() => onChange(item.view)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition ${view === item.view ? 'bg-primary/[0.08] font-semibold text-primary' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'}`}><item.icon className="h-4 w-4" /><span className="flex-1">{item.label}</span>{item.count ? <span className="rounded-md bg-background/70 px-1.5 py-0.5 font-mono text-[9px]">{item.count}</span> : null}</button>)}</div></nav>
}

function MobileSidebar({ onClose, view, onChange, completed, active }: { onClose: () => void; view: WorkspaceView; onChange: (view: WorkspaceView) => void; completed: number; active: number }) {
  return <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><button className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={onClose} aria-label="Close navigation" /><motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }} className="relative h-full w-72 border-r border-border bg-background p-4 shadow-2xl"><div className="mb-6 flex items-center justify-between"><Brand /><Button size="icon" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button></div><Sidebar view={view} onChange={onChange} completed={completed} active={active} /></motion.aside></motion.div>
}

function DriveRow({ item, selected, onSelect, onOpenFolder, onRename, onMove, onTrash, onCopyLink }: ItemProps) {
  return <div onClick={onSelect} onDoubleClick={() => isDriveFolder(item) && onOpenFolder()} className={`grid cursor-default grid-cols-[minmax(0,1fr)_46px] items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_120px_100px_46px] sm:px-5 ${selected ? 'bg-primary/[0.055]' : 'hover:bg-secondary/35'}`}><div className="flex min-w-0 items-center gap-3"><ItemIcon item={item} /><div className="min-w-0"><button onClick={(event) => { event.stopPropagation(); if (isDriveFolder(item)) onOpenFolder(); else onSelect() }} className="max-w-full truncate text-left text-sm font-semibold hover:underline">{item.name}</button><p className="mt-0.5 text-[10px] text-muted-foreground sm:hidden">{formatItemMeta(item)}</p></div></div><span className="hidden text-xs text-muted-foreground sm:block">{formatDate(item.modifiedTime)}</span><span className="hidden text-xs text-muted-foreground sm:block">{isDriveFolder(item) ? 'Folder' : item.size ? formatBytes(Number(item.size)) : '—'}</span><ItemActions item={item} onRename={onRename} onMove={onMove} onTrash={onTrash} onCopyLink={onCopyLink} /></div>
}

function DriveCard({ item, selected, onSelect, onOpenFolder, onRename, onMove, onTrash, onCopyLink }: ItemProps) {
  return <div onClick={onSelect} onDoubleClick={() => isDriveFolder(item) && onOpenFolder()} className={`rounded-[1.2rem] border p-4 transition ${selected ? 'border-primary/35 bg-primary/[0.04]' : 'border-border/70 bg-card/70 hover:border-primary/20'}`}><div className="flex items-start justify-between gap-3"><ItemIcon item={item} large /><ItemActions item={item} onRename={onRename} onMove={onMove} onTrash={onTrash} onCopyLink={onCopyLink} /></div><button onClick={(event) => { event.stopPropagation(); if (isDriveFolder(item)) onOpenFolder(); else onSelect() }} className="mt-5 block max-w-full truncate text-left text-sm font-semibold hover:underline">{item.name}</button><p className="mt-1 text-[10px] text-muted-foreground">{formatItemMeta(item)}</p></div>
}

type ItemProps = { item: DriveItem; selected: boolean; onSelect: () => void; onOpenFolder: () => void; onRename: () => void; onMove: () => void; onTrash: () => void; onCopyLink: () => void }

function ItemActions({ item, onRename, onMove, onTrash, onCopyLink }: Pick<ItemProps, 'item' | 'onRename' | 'onMove' | 'onTrash' | 'onCopyLink'>) {
  return <DropdownMenu.Root><DropdownMenu.Trigger asChild><button onClick={(event) => event.stopPropagation()} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground outline-none hover:bg-secondary hover:text-foreground" aria-label={`Actions for ${item.name}`}><MoreVertical className="h-4 w-4" /></button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={6} className="z-[70] w-48 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-float"><MenuItem icon={Pencil} label="Rename" action={onRename} /><MenuItem icon={Move} label="Move" action={onMove} />{item.webViewLink && <DropdownMenu.Item asChild className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs outline-none hover:bg-secondary focus:bg-secondary"><a href={item.webViewLink} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /> Open in Drive</a></DropdownMenu.Item>}{item.webViewLink && <MenuItem icon={Copy} label="Copy Drive link" action={onCopyLink} />}<DropdownMenu.Separator className="my-1 h-px bg-border" /><DropdownMenu.Item onSelect={onTrash} className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-destructive outline-none hover:bg-destructive/10 focus:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /> Move to trash</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
}

function MenuItem({ icon: Icon, label, action }: { icon: typeof Pencil; label: string; action: () => void }) {
  return <DropdownMenu.Item onSelect={action} className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs outline-none hover:bg-secondary focus:bg-secondary"><Icon className="h-3.5 w-3.5" /> {label}</DropdownMenu.Item>
}

function DetailsPanel({ item }: { item: DriveItem | null }) {
  if (!item) return <div className="rounded-[1.35rem] border border-border/70 bg-card/68 p-5"><p className="font-mono text-[8px] uppercase tracking-[0.15em] text-muted-foreground">details</p><div className="mt-8 text-center"><Cloud className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-3 text-sm font-semibold">Select an item</p><p className="mt-1 text-xs leading-5 text-muted-foreground">File or folder metadata will appear here.</p></div></div>
  return <div className="rounded-[1.35rem] border border-border/70 bg-card/68 p-5"><div className="flex items-center gap-3"><ItemIcon item={item} large /><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{isDriveFolder(item) ? 'Folder' : item.mimeType}</p></div></div><dl className="mt-5 space-y-3 text-xs"><Detail label="Modified" value={formatDate(item.modifiedTime)} /><Detail label="Created" value={formatDate(item.createdTime)} /><Detail label="Size" value={isDriveFolder(item) ? 'Folder' : item.size ? formatBytes(Number(item.size)) : '—'} /><Detail label="Drive ID" value={item.id} mono /></dl>{item.webViewLink && <Button asChild variant="outline" className="mt-5 w-full"><a href={item.webViewLink} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Open in Drive</a></Button>}</div>
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><dt className="text-[10px] text-muted-foreground">{label}</dt><dd className={`mt-1 break-all ${mono ? 'font-mono text-[10px]' : 'font-medium'}`}>{value}</dd></div>
}

function ItemIcon({ item, large = false }: { item: DriveItem; large?: boolean }) {
  const Icon = isDriveFolder(item) ? Folder : File
  return <span className={`grid shrink-0 place-items-center rounded-xl border border-border bg-background shadow-sm ${large ? 'h-11 w-11' : 'h-9 w-9'} ${isDriveFolder(item) ? 'text-amber-500' : 'text-primary'}`}><Icon className={large ? 'h-5 w-5' : 'h-4 w-4'} /></span>
}

function EmptyFiles({ onCreateFolder, onUpload }: { onCreateFolder: () => void; onUpload: () => void }) {
  return <div className="relative overflow-hidden rounded-[1.35rem] border border-dashed border-border bg-card/45 px-6 py-16 text-center"><div className="pointer-events-none absolute inset-0 signal-grid opacity-25" /><div className="relative"><Folder className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-4 text-sm font-semibold">This folder is empty</p><p className="mt-1 text-xs text-muted-foreground">Create a folder or upload files here.</p><div className="mt-5 flex justify-center gap-2"><Button variant="outline" size="sm" onClick={onCreateFolder}><FolderPlus className="h-3.5 w-3.5" /> New folder</Button><Button size="sm" onClick={onUpload}><Upload className="h-3.5 w-3.5" /> Upload</Button></div></div></div>
}

function WorkspaceLoading() {
  return <div className="rounded-[1.35rem] border border-border/70 bg-card/55 px-6 py-16 text-center"><RefreshCw className="mx-auto h-5 w-5 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">Loading Google Drive…</p></div>
}

function TextDialogModal({ dialog, value, onValue, onClose, onSubmit }: { dialog: TextDialog; value: string; onValue: (value: string) => void; onClose: () => void; onSubmit: () => void }) {
  if (!dialog) return null
  const title = dialog.kind === 'create' ? 'Create folder' : 'Rename item'
  return <ModalShell onClose={onClose}><form onSubmit={(event) => { event.preventDefault(); onSubmit() }} className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-float"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><Button type="button" variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button></div><input autoFocus value={value} onChange={(event) => onValue(event.target.value)} className="mt-5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/[0.06]" placeholder={dialog.kind === 'create' ? 'Folder name' : 'New name'} /><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!value.trim()}>{dialog.kind === 'create' ? 'Create' : 'Save'}</Button></div></form></ModalShell>
}

function MoveModal({ item, folders, loading, rootFolder, onClose, onMove }: { item: DriveItem | null; folders: DriveItem[]; loading: boolean; rootFolder: DriveItem | null; onClose: () => void; onMove: (folderId: string) => void }) {
  if (!item) return null
  const choices = folders.filter((folder, index, all) => all.findIndex((candidate) => candidate.id === folder.id) === index)
  return <ModalShell onClose={onClose}><div className="w-full max-w-lg rounded-2xl border border-border bg-background p-5 shadow-float"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Move {item.name}</h2><p className="mt-1 text-xs text-muted-foreground">Choose a FlashUpload-managed Drive folder.</p></div><Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button></div><div className="mt-5 max-h-80 space-y-1 overflow-auto">{loading ? <WorkspaceLoading /> : choices.length ? choices.map((folder) => <button key={folder.id} onClick={() => onMove(folder.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-secondary"><Folder className="h-4 w-4 text-amber-500" /><span className="min-w-0 flex-1 truncate text-sm">{folder.id === rootFolder?.id ? 'FlashUpload' : folder.name}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>) : <p className="py-8 text-center text-sm text-muted-foreground">No destination folders available.</p>}</div></div></ModalShell>
}

function ConfirmModal({ open, title, text, confirmLabel, danger = false, onClose, onConfirm }: { open: boolean; title: string; text: string; confirmLabel: string; danger?: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!open) return null
  return <ModalShell onClose={onClose}><div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-float"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p><div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant={danger ? 'danger' : 'default'} onClick={onConfirm}>{confirmLabel}</Button></div></div></ModalShell>
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[80] grid place-items-center p-4"><button className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={onClose} aria-label="Close dialog" /><div className="relative z-10 flex w-full justify-center">{children}</div></div>
}

function SettingCard({ title, icon: Icon, children }: { title: string; icon: typeof SlidersHorizontal; children: React.ReactNode }) {
  return <div className="rounded-[1.35rem] border border-border/70 bg-card/68 p-5"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">{title}</h2></div><div className="mt-5">{children}</div></div>
}

function HelpCard({ index, title, text }: { index: string; title: string; text: string }) {
  return <article className="rounded-[1.35rem] border border-border/70 bg-card/68 p-5"><p className="font-mono text-[9px] text-primary">/{index}</p><h2 className="mt-5 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>
}

function Metric({ icon: Icon, label, value, sub }: { icon: typeof UploadCloud; label: string; value: string; sub: string }) {
  return <div className="flex items-center gap-3 p-4 sm:p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-background text-primary shadow-sm"><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 truncate text-lg font-semibold tracking-[-0.025em]">{value}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{sub}</p></div></div>
}

function EmptyQueue({ query }: { query: string }) {
  return <div className="relative overflow-hidden rounded-[1.35rem] border border-dashed border-border bg-card/45 px-6 py-14 text-center"><div className="pointer-events-none absolute inset-0 signal-grid opacity-25" /><div className="relative"><UploadCloud className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-4 text-sm font-semibold">{query ? 'No matching transfers' : 'The queue is clear'}</p><p className="mt-1 text-xs text-muted-foreground">{query ? 'Try another filename.' : 'Drop files into the transfer composer above.'}</p></div></div>
}

function AccountMenu({ profile, onDisconnect }: { profile: GoogleProfile; onDisconnect: () => Promise<void> }) {
  return <DropdownMenu.Root><DropdownMenu.Trigger asChild><button className="ml-1 grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-border bg-secondary text-xs font-semibold outline-none ring-primary/30 focus:ring-2">{profile.picture ? <img src={profile.picture} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : profile.name.slice(0, 1).toUpperCase()}</button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={8} className="z-[60] w-64 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-float"><div className="px-3 py-2"><p className="truncate text-sm font-medium">{profile.name}</p><p className="truncate text-xs text-muted-foreground">{profile.email}</p></div><DropdownMenu.Separator className="my-1 h-px bg-border" /><DropdownMenu.Item onSelect={() => void onDisconnect()} className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none hover:bg-secondary focus:bg-secondary"><LogOut className="h-4 w-4" /> Disconnect Google</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatItemMeta(item: DriveItem) {
  if (isDriveFolder(item)) return `Folder · ${formatDate(item.modifiedTime)}`
  return `${item.size ? formatBytes(Number(item.size)) : 'Unknown size'} · ${formatDate(item.modifiedTime)}`
}

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}
