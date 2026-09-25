import { useEffect, useMemo, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Cloud, Gauge, HelpCircle, LogOut, Menu, Search, Settings2, ShieldCheck, SlidersHorizontal, UploadCloud, Wifi, WifiOff, X } from 'lucide-react'
import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { UploadDropzone } from '@/components/upload-dropzone'
import { UploadItem } from '@/components/upload-item'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { GoogleProfile } from '@/lib/google-auth'
import type { Theme } from '@/hooks/use-theme'
import { useUploadManager } from '@/hooks/use-upload-manager'
import { formatBytes, formatSpeed } from '@/lib/utils'

export function Dashboard({ profile, theme, onToggleTheme, ensureToken, onDisconnect }: { profile: GoogleProfile; theme: Theme; onToggleTheme: () => void; ensureToken: () => Promise<string | null>; onDisconnect: () => Promise<void> }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [shareAfterUpload, setShareAfterUpload] = useState(false)
  const [concurrency, setConcurrency] = useState(2)
  const [query, setQuery] = useState('')
  const online = useOnlineStatus()
  const manager = useUploadManager({ getAccessToken: ensureToken, concurrency, shareAfterUpload })
  const visibleTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return normalized ? manager.tasks.filter((task) => task.file.name.toLowerCase().includes(normalized)) : manager.tasks
  }, [manager.tasks, query])
  const completed = manager.tasks.filter((task) => Boolean(task.result)).length

  return <div className="min-h-screen bg-muted/35 text-foreground">
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-border/70 bg-background/90 px-3 backdrop-blur-xl sm:px-5"><Button variant="ghost" size="icon" className="mr-1 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></Button><Brand /><div className="mx-auto hidden w-full max-w-2xl px-8 md:block"><div className="flex h-11 items-center gap-3 rounded-full bg-secondary/80 px-4 focus-within:ring-2 focus-within:ring-primary/20"><Search className="h-4.5 w-4.5 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Search uploads" />{query && <button onClick={() => setQuery('')} className="rounded-full p-1 text-muted-foreground hover:bg-background" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}</div></div><div className="ml-auto flex items-center gap-1"><span className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">{online ? <Wifi className="h-3.5 w-3.5 text-emerald-500" /> : <WifiOff className="h-3.5 w-3.5 text-destructive" />}{online ? 'Online' : 'Offline'}</span><ThemeToggle theme={theme} onToggle={onToggleTheme} /><AccountMenu profile={profile} onDisconnect={onDisconnect} /></div></header>
    <div className="mx-auto flex max-w-[1600px]"><aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-border/60 bg-background/70 p-4 lg:block"><Sidebar completed={completed} active={manager.stats.active} /></aside><AnimatePresence>{sidebarOpen && <MobileSidebar onClose={() => setSidebarOpen(false)} completed={completed} active={manager.stats.active} />}</AnimatePresence><main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">My Drive</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Upload center</h1><p className="mt-2 text-sm text-muted-foreground">Keep this tab open while files are transferring. Pausing is safe; after a reload, reselect the same file to resume its saved session.</p></div><Badge className="w-fit gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> Browser → Google Drive</Badge></div>
      <UploadDropzone onFiles={manager.addFiles} />
      <div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric icon={UploadCloud} label="Uploaded" value={formatBytes(manager.stats.uploadedBytes)} sub={manager.stats.totalBytes ? `of ${formatBytes(manager.stats.totalBytes)}` : 'No files yet'} /><Metric icon={Gauge} label="Combined speed" value={manager.stats.speed > 0 ? formatSpeed(manager.stats.speed) : '—'} sub={`${manager.stats.active} active transfer${manager.stats.active === 1 ? '' : 's'}`} /><Metric icon={CheckCircle2} label="Completed" value={String(completed)} sub={`${manager.tasks.length} file${manager.tasks.length === 1 ? '' : 's'} in this session`} /></div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_310px]"><section className="min-w-0"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold">Uploads</h2><p className="text-xs text-muted-foreground">Adaptive resumable queue</p></div>{manager.tasks.some((task) => ['complete', 'canceled'].includes(task.status)) && <Button variant="ghost" size="sm" onClick={manager.clearFinished}>Clear finished</Button>}</div><div className="space-y-3">{visibleTasks.length ? visibleTasks.map((task) => <UploadItem key={task.id} task={task} onPause={() => manager.pause(task.id)} onResume={() => manager.resume(task.id)} onCancel={() => manager.cancel(task.id)} onRetry={() => manager.retry(task.id)} />) : <EmptyQueue query={query} />}</div></section>
        <aside className="space-y-4"><Card className="p-5"><div className="flex items-center gap-2"><SlidersHorizontal className="h-4.5 w-4.5 text-primary" /><h3 className="font-semibold">Transfer settings</h3></div><div className="mt-5 space-y-5"><div><div className="flex items-center justify-between text-sm"><span>Parallel files</span><span className="font-medium">{concurrency}</span></div><input type="range" min={1} max={3} step={1} value={concurrency} onChange={(event) => setConcurrency(Number(event.target.value))} className="mt-3 w-full accent-[hsl(var(--primary))]" /><p className="mt-1.5 text-xs leading-5 text-muted-foreground">Chunks inside one Drive upload stay sequential. Parallelism applies across separate files.</p></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3"><input type="checkbox" checked={shareAfterUpload} onChange={(event) => setShareAfterUpload(event.target.checked)} className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" /><span><span className="block text-sm font-medium">Anyone-with-link after upload</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Off by default for privacy. Enable only when you need to send the Drive link outside your account.</span></span></label></div></Card><Card className="p-5"><div className="flex items-start gap-3"><Cloud className="mt-0.5 h-5 w-5 text-primary" /><div><h3 className="text-sm font-semibold">No relay server</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Your file bytes are uploaded directly to Google. FlashUpload only runs the browser-side upload logic.</p></div></div></Card></aside>
      </div>
    </div></main></div>
  </div>
}

function Sidebar({ completed, active }: { completed: number; active: number }) {
  const items = [{ icon: UploadCloud, label: 'Upload center', count: active || undefined, active: true }, { icon: CheckCircle2, label: 'Completed', count: completed || undefined }, { icon: Settings2, label: 'Settings' }, { icon: HelpCircle, label: 'How it works' }]
  return <nav className="space-y-1">{items.map((item) => <button key={item.label} className={`flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm transition ${item.active ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}><item.icon className="h-4.5 w-4.5" /><span className="flex-1">{item.label}</span>{item.count ? <span className="text-xs">{item.count}</span> : null}</button>)}</nav>
}

function MobileSidebar({ onClose, completed, active }: { onClose: () => void; completed: number; active: number }) {
  return <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><button className="absolute inset-0 bg-black/30" onClick={onClose} aria-label="Close navigation" /><motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }} className="relative h-full w-72 bg-background p-4 shadow-2xl"><div className="mb-5 flex items-center justify-between"><Brand /><Button size="icon" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button></div><Sidebar completed={completed} active={active} /></motion.aside></motion.div>
}

function Metric({ icon: Icon, label, value, sub }: { icon: typeof UploadCloud; label: string; value: string; sub: string }) {
  return <Card className="p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4.5 w-4.5" /></span><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 font-semibold">{value}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p></div></div></Card>
}

function EmptyQueue({ query }: { query: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center"><UploadCloud className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium">{query ? 'No matching uploads' : 'Your queue is empty'}</p><p className="mt-1 text-xs text-muted-foreground">{query ? 'Try another filename.' : 'Drop files above to begin.'}</p></div>
}

function AccountMenu({ profile, onDisconnect }: { profile: GoogleProfile; onDisconnect: () => Promise<void> }) {
  return <DropdownMenu.Root><DropdownMenu.Trigger asChild><button className="ml-1 grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-border bg-secondary text-xs font-semibold outline-none ring-primary/30 focus:ring-2">{profile.picture ? <img src={profile.picture} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : profile.name.slice(0, 1).toUpperCase()}</button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={8} className="z-[60] w-64 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-float"><div className="px-3 py-2"><p className="truncate text-sm font-medium">{profile.name}</p><p className="truncate text-xs text-muted-foreground">{profile.email}</p></div><DropdownMenu.Separator className="my-1 h-px bg-border" /><DropdownMenu.Item onSelect={() => void onDisconnect()} className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none hover:bg-secondary focus:bg-secondary"><LogOut className="h-4 w-4" /> Disconnect Google</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
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
