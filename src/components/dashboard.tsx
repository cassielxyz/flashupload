import { useEffect, useMemo, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Cloud,
  Gauge,
  HelpCircle,
  LogOut,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
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
import { formatBytes, formatSpeed } from '@/lib/utils'

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 signal-grid opacity-[0.32] dark:opacity-[0.2]" />

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1700px] items-center px-3 sm:px-5 lg:px-6">
          <Button variant="ghost" size="icon" className="mr-1 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></Button>
          <Brand />
          <span className="ml-3 hidden rounded-full border border-border/70 bg-secondary/55 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground sm:inline">transfer workspace</span>

          <div className="mx-auto hidden w-full max-w-2xl px-10 md:block">
            <div className="flex h-10 items-center gap-3 rounded-full border border-transparent bg-secondary/65 px-4 transition focus-within:border-primary/20 focus-within:bg-background focus-within:ring-4 focus-within:ring-primary/[0.06]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Search transfer queue" />
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
          <Sidebar completed={completed} active={manager.stats.active} />
          <div className="absolute inset-x-3 bottom-5 rounded-2xl border border-border/70 bg-card/65 p-3.5">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">route</p>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Browser → Drive</div>
            <p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">No FlashUpload relay server.</p>
          </div>
        </aside>

        <AnimatePresence>{sidebarOpen && <MobileSidebar onClose={() => setSidebarOpen(false)} completed={completed} active={manager.stats.active} />}</AnimatePresence>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[1220px]">
            <div className="mb-7 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="h-px w-6 bg-primary" /> my drive / upload center
                </div>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-[2.75rem]">Transfer workspace</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Keep this tab open while transferring. If a session pauses or the network drops, FlashUpload resumes from Drive's confirmed byte range.</p>
              </div>
              <div className="flex items-center gap-2 self-start rounded-full border border-emerald-500/20 bg-emerald-500/[0.055] px-3 py-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 xl:self-auto">
                <ShieldCheck className="h-3.5 w-3.5" /> direct browser route
              </div>
            </div>

            <UploadDropzone onFiles={manager.addFiles} />

            <div className="mt-5 overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/68 backdrop-blur">
              <div className="grid divide-y divide-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <Metric icon={UploadCloud} label="transferred" value={formatBytes(manager.stats.uploadedBytes)} sub={manager.stats.totalBytes ? `of ${formatBytes(manager.stats.totalBytes)}` : 'waiting for files'} />
                <Metric icon={Gauge} label="combined speed" value={manager.stats.speed > 0 ? formatSpeed(manager.stats.speed) : '—'} sub={`${manager.stats.active} active transfer${manager.stats.active === 1 ? '' : 's'}`} />
                <Metric icon={CheckCircle2} label="completed" value={String(completed).padStart(2, '0')} sub={`${manager.tasks.length} file${manager.tasks.length === 1 ? '' : 's'} this session`} />
              </div>
            </div>

            <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_300px]">
              <section className="min-w-0">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">queue / adaptive resumable</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em]">Transfers</h2>
                  </div>
                  {manager.tasks.some((task) => ['complete', 'canceled'].includes(task.status)) && <Button variant="ghost" size="sm" onClick={manager.clearFinished}>Clear finished</Button>}
                </div>
                <div className="space-y-3">
                  {visibleTasks.length ? visibleTasks.map((task) => (
                    <UploadItem key={task.id} task={task} onPause={() => manager.pause(task.id)} onResume={() => manager.resume(task.id)} onCancel={() => manager.cancel(task.id)} onRetry={() => manager.retry(task.id)} />
                  )) : <EmptyQueue query={query} />}
                </div>
              </section>

              <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                <div className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/72 backdrop-blur">
                  <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3.5"><SlidersHorizontal className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Engine tuning</h3></div>
                  <div className="space-y-5 p-4">
                    <div>
                      <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Parallel files</span><span className="rounded-md bg-secondary px-2 py-1 font-mono text-[10px] font-semibold">{concurrency}</span></div>
                      <input type="range" min={1} max={3} step={1} value={concurrency} onChange={(event) => setConcurrency(Number(event.target.value))} className="mt-3 w-full accent-[hsl(var(--primary))]" />
                      <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Parallelism applies across files. Each Drive upload keeps its chunks ordered.</p>
                    </div>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-background/45 p-3">
                      <input type="checkbox" checked={shareAfterUpload} onChange={(event) => setShareAfterUpload(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" />
                      <span><span className="block text-xs font-semibold">Anyone-with-link</span><span className="mt-1 block text-[10px] leading-4 text-muted-foreground">Off by default. Enable only when a public Drive link is needed.</span></span>
                    </label>
                  </div>
                </div>

                <div className="rounded-[1.35rem] border border-border/70 bg-[#07111f] p-4 text-white shadow-[0_22px_60px_-42px_rgba(2,6,23,.8)]">
                  <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.15em] text-slate-500"><span>route monitor</span><span className="flex items-center gap-1.5 text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> live</span></div>
                  <div className="mt-5 flex items-center gap-2">
                    <RouteMini label="browser" />
                    <div className="relative h-px flex-1 bg-white/15"><motion.span className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-blue-300" animate={{ left: ['0%', '94%'], opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} /></div>
                    <RouteMini label="drive" />
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/10 text-[9px]"><TinyStat label="payload relay" value="none" /><TinyStat label="scope" value="drive.file" /></div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function Sidebar({ completed, active }: { completed: number; active: number }) {
  const items = [
    { icon: Activity, label: 'Transfer workspace', count: active || undefined, active: true },
    { icon: CheckCircle2, label: 'Completed', count: completed || undefined },
    { icon: Settings2, label: 'Settings' },
    { icon: HelpCircle, label: 'How it works' },
  ]
  return (
    <nav>
      <p className="mb-3 px-3 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">workspace</p>
      <div className="space-y-1">
        {items.map((item) => (
          <button key={item.label} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition ${item.active ? 'bg-primary/[0.08] font-semibold text-primary' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'}`}>
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {item.count ? <span className="rounded-md bg-background/70 px-1.5 py-0.5 font-mono text-[9px]">{item.count}</span> : null}
          </button>
        ))}
      </div>
    </nav>
  )
}

function MobileSidebar({ onClose, completed, active }: { onClose: () => void; completed: number; active: number }) {
  return (
    <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={onClose} aria-label="Close navigation" />
      <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }} className="relative h-full w-72 border-r border-border bg-background p-4 shadow-2xl">
        <div className="mb-6 flex items-center justify-between"><Brand /><Button size="icon" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button></div>
        <Sidebar completed={completed} active={active} />
      </motion.aside>
    </motion.div>
  )
}

function Metric({ icon: Icon, label, value, sub }: { icon: typeof UploadCloud; label: string; value: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 p-4 sm:p-5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-background text-primary shadow-sm"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0">
        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-lg font-semibold tracking-[-0.025em]">{value}</p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  )
}

function EmptyQueue({ query }: { query: string }) {
  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-dashed border-border bg-card/45 px-6 py-14 text-center">
      <div className="pointer-events-none absolute inset-0 signal-grid opacity-25" />
      <div className="relative">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-border bg-background text-muted-foreground"><UploadCloud className="h-5 w-5" /></span>
        <p className="mt-4 text-sm font-semibold">{query ? 'No matching transfers' : 'The queue is clear'}</p>
        <p className="mt-1 text-xs text-muted-foreground">{query ? 'Try another filename.' : 'Drop files into the transfer composer above.'}</p>
      </div>
    </div>
  )
}

function AccountMenu({ profile, onDisconnect }: { profile: GoogleProfile; onDisconnect: () => Promise<void> }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="ml-1 grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-border bg-secondary text-xs font-semibold outline-none ring-primary/30 focus:ring-2">
          {profile.picture ? <img src={profile.picture} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : profile.name.slice(0, 1).toUpperCase()}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className="z-[60] w-64 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-float">
          <div className="px-3 py-2"><p className="truncate text-sm font-medium">{profile.name}</p><p className="truncate text-xs text-muted-foreground">{profile.email}</p></div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item onSelect={() => void onDisconnect()} className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none hover:bg-secondary focus:bg-secondary"><LogOut className="h-4 w-4" /> Disconnect Google</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function RouteMini({ label }: { label: string }) {
  return <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.045] text-center font-mono text-[7px] uppercase tracking-[0.1em] text-slate-300">{label}</div>
}

function TinyStat({ label, value }: { label: string; value: string }) {
  return <div className="bg-[#0b1625] p-2.5"><p className="font-mono text-[7px] uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 text-[10px] font-semibold text-slate-200">{value}</p></div>
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
