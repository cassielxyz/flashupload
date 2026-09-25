import { useEffect } from 'react'
import Lenis from 'lenis'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Cloud,
  Github,
  HardDrive,
  Pause,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Wifi,
  Zap,
} from 'lucide-react'
import { Brand } from '@/components/brand'
import { GoogleConnectButton } from '@/components/google-connect-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import type { Theme } from '@/hooks/use-theme'

const protocol = [
  {
    index: '01',
    title: 'Slice without loading the whole file',
    text: 'FlashUpload reads only the next Drive-compatible chunk from disk, so multi-gigabyte files do not need to live in browser memory.',
  },
  {
    index: '02',
    title: 'Stream directly to your Drive',
    text: 'The browser talks to Google Drive itself. There is no FlashUpload relay server sitting between your device and your account.',
  },
  {
    index: '03',
    title: 'Resume from the byte Google confirms',
    text: 'If the connection breaks, the session asks Drive how much it received, then continues from that checkpoint instead of restarting.',
  },
]

export function Landing({
  loading,
  error,
  configured,
  theme,
  onToggleTheme,
  onConnect,
}: {
  loading: boolean
  error: string | null
  configured: boolean
  theme: Theme
  onToggleTheme: () => void
  onConnect: () => void
}) {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.08, smoothWheel: true })
    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0 signal-grid opacity-[0.55] dark:opacity-[0.28]" />
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="mx-auto flex h-14 max-w-[1380px] items-center rounded-[1.15rem] border border-border/70 bg-background/78 px-3 shadow-[0_8px_40px_-28px_rgba(15,23,42,.55)] backdrop-blur-2xl sm:px-4">
          <Brand />
          <nav className="ml-8 hidden items-center gap-1 text-xs font-medium text-muted-foreground md:flex">
            <a href="#system" className="rounded-full px-3 py-2 transition hover:bg-secondary hover:text-foreground">System</a>
            <a href="#protocol" className="rounded-full px-3 py-2 transition hover:bg-secondary hover:text-foreground">Protocol</a>
            <a href="#privacy" className="rounded-full px-3 py-2 transition hover:bg-secondary hover:text-foreground">Privacy</a>
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <a
              href="https://github.com/cassielxyz/flashupload"
              target="_blank"
              rel="noreferrer"
              className="hidden h-9 items-center gap-2 rounded-full px-3 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:inline-flex"
            >
              <Github className="h-4 w-4" /> Source
            </a>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <Button size="sm" onClick={onConnect} className="px-4">
              Open uploader <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="relative mx-auto min-h-screen max-w-[1480px] px-5 pb-16 pt-32 sm:px-8 lg:px-12 lg:pt-36">
          <div className="pointer-events-none absolute left-[18%] top-10 h-[28rem] w-[28rem] rounded-full bg-blue-500/[0.08] blur-[120px] dark:bg-blue-500/[0.12]" />
          <div className="pointer-events-none absolute right-[-8rem] top-52 h-[32rem] w-[32rem] rounded-full bg-cyan-400/[0.08] blur-[130px] dark:bg-cyan-400/[0.07]" />

          <div className="grid min-h-[calc(100vh-9rem)] items-center gap-16 lg:grid-cols-[0.9fr_1.1fr] xl:gap-24">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10"
            >
              <div className="mb-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                <span className="h-px w-8 bg-primary" />
                Upload protocol / 01
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-2.5 py-1 normal-case tracking-normal text-emerald-700 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,.10)]" />
                  direct route
                </span>
              </div>

              <h1 className="max-w-3xl text-balance text-[3.65rem] font-semibold leading-[0.96] tracking-[-0.065em] sm:text-[4.7rem] lg:text-[5.25rem] xl:text-[6.1rem]">
                Large files should
                <span className="relative block text-primary">
                  finish.
                  <svg className="absolute -bottom-2 left-0 h-3 w-40 overflow-visible opacity-45 sm:w-52" viewBox="0 0 210 12" fill="none" aria-hidden="true">
                    <path d="M2 8C50 1 119 2 208 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                Not restart.
              </h1>

              <p className="mt-8 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                FlashUpload is a focused transfer surface for Google Drive: adaptive resumable chunks, live throughput, and recovery that continues from the last byte Drive actually received.
              </p>

              <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <GoogleConnectButton loading={loading} onClick={onConnect} className="h-12 border-foreground/10 bg-foreground px-5 text-background hover:bg-foreground/90 hover:text-background" />
                <button onClick={() => document.querySelector('#system')?.scrollIntoView({ behavior: 'smooth' })} className="group inline-flex h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
                  See the transfer engine
                  <span className="grid h-7 w-7 place-items-center rounded-full border border-border transition group-hover:translate-x-0.5 group-hover:border-foreground/30"><ArrowRight className="h-3.5 w-3.5" /></span>
                </button>
              </div>

              {!configured && (
                <p className="mt-4 max-w-lg rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
                  Google OAuth is not configured yet. Add your Web Client ID after deployment to enable live uploads.
                </p>
              )}
              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

              <div className="mt-12 grid max-w-xl grid-cols-3 border-y border-border/70 py-4 text-[11px] sm:text-xs">
                <div className="pr-3"><p className="font-semibold text-foreground">256 KiB</p><p className="mt-1 text-muted-foreground">Drive alignment</p></div>
                <div className="border-l border-border/70 px-3"><p className="font-semibold text-foreground">8–32 MiB</p><p className="mt-1 text-muted-foreground">adaptive chunks</p></div>
                <div className="border-l border-border/70 pl-3"><p className="font-semibold text-foreground">0 bytes</p><p className="mt-1 text-muted-foreground">stored by us</p></div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.965, y: 34 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-[760px]"
            >
              <TransferScene />
            </motion.div>
          </div>
        </section>

        <section id="system" className="mx-auto max-w-[1480px] px-4 py-12 sm:px-8 lg:px-12 lg:py-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#07111f] text-white shadow-[0_40px_100px_-55px_rgba(2,6,23,.75)] sm:rounded-[2.6rem]">
            <div className="pointer-events-none absolute inset-0 system-grid opacity-35" />
            <div className="pointer-events-none absolute -right-28 top-[-10rem] h-[34rem] w-[34rem] rounded-full bg-blue-500/25 blur-[130px]" />
            <div className="pointer-events-none absolute -left-24 bottom-[-13rem] h-[30rem] w-[30rem] rounded-full bg-cyan-300/10 blur-[120px]" />

            <div className="relative grid gap-16 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[0.82fr_1.18fr] lg:px-16 lg:py-20">
              <div className="flex flex-col justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-blue-200/65">Transfer engine / live route</p>
                  <h2 className="mt-5 max-w-lg text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl">A boringly reliable path for very large files.</h2>
                  <p className="mt-6 max-w-md text-sm leading-7 text-slate-300">The interface stays quiet while the protocol does the complicated work: negotiate a session, stream slices, confirm ranges, retry only what is necessary.</p>
                </div>
                <div className="mt-10 flex flex-wrap gap-2 text-[11px] text-slate-300">
                  {['no relay', 'range recovery', 'adaptive sizing', 'parallel files'].map((label) => (
                    <span key={label} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">{label}</span>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[430px] rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur sm:p-6">
                <EngineMap />
              </div>
            </div>
          </div>
        </section>

        <section id="protocol" className="mx-auto max-w-[1380px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">How it survives interruptions</p>
              <h2 className="mt-5 max-w-md text-4xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-5xl">Three small decisions make uploads feel dramatically better.</h2>
              <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">No invented speed claims. FlashUpload cannot exceed your connection; it focuses on using that connection efficiently and avoiding waste when it drops.</p>
            </div>

            <div className="divide-y divide-border/80 border-y border-border/80">
              {protocol.map((item, index) => (
                <motion.article
                  key={item.index}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-90px' }}
                  transition={{ delay: index * 0.06, duration: 0.55 }}
                  className="group grid gap-6 py-10 sm:grid-cols-[84px_1fr_50px] sm:items-start sm:py-14"
                >
                  <span className="font-mono text-xs text-muted-foreground">/{item.index}</span>
                  <div>
                    <h3 className="text-2xl font-semibold tracking-[-0.03em] transition group-hover:text-primary sm:text-3xl">{item.title}</h3>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{item.text}</p>
                  </div>
                  <span className="hidden h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition group-hover:translate-x-1 group-hover:border-primary/40 group-hover:text-primary sm:grid"><ArrowRight className="h-4 w-4" /></span>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="privacy" className="mx-auto max-w-[1380px] px-5 pb-24 sm:px-8 lg:px-12 lg:pb-32">
          <div className="grid overflow-hidden rounded-[2rem] border border-border/75 bg-card/60 shadow-[0_24px_80px_-50px_rgba(15,23,42,.45)] backdrop-blur lg:grid-cols-[1fr_1fr]">
            <div className="border-b border-border/70 p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-14">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><ShieldCheck className="h-4 w-4" /> Privacy is part of the route</div>
              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.045em]">Your file does not take a detour through us.</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">FlashUpload runs the transfer logic in your browser and requests the narrow Google Drive <code>drive.file</code> permission. Public link sharing is optional and off by default.</p>
            </div>
            <div className="grid divide-y divide-border/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-1 lg:divide-x-0 lg:divide-y xl:grid-cols-2 xl:divide-x xl:divide-y-0">
              <PrivacyCell icon={HardDrive} title="Local source" text="The selected file stays on your device until each slice is sent to Google." />
              <PrivacyCell icon={Cloud} title="Drive destination" text="Upload bytes terminate at Google Drive, not a FlashUpload storage bucket." />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1380px] px-5 pb-16 sm:px-8 lg:px-12 lg:pb-24">
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-primary/[0.045] px-7 py-12 text-center sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute inset-0 signal-grid opacity-35" />
            <div className="relative">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Ready / transfer session</p>
              <h2 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Put the next 700 MB file on a route that can recover.</h2>
              <div className="mt-8 flex justify-center"><GoogleConnectButton loading={loading} onClick={onConnect} className="h-12 bg-background" /></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/70 py-7">
        <div className="mx-auto flex max-w-[1380px] flex-col gap-4 px-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <Brand compact />
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span>Browser → Google Drive</span>
            <a href="https://github.com/cassielxyz/flashupload" target="_blank" rel="noreferrer" className="transition hover:text-foreground">Open source</a>
            <span>FlashUpload does not store file bytes</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function TransferScene() {
  return (
    <div className="relative">
      <div className="absolute -left-8 top-16 hidden h-28 w-28 rounded-full border border-primary/15 lg:block" />
      <div className="absolute -left-12 top-12 hidden h-36 w-36 rounded-full border border-primary/10 lg:block" />
      <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/82 p-3 shadow-[0_35px_100px_-48px_rgba(15,23,42,.55)] backdrop-blur-xl sm:p-4">
        <div className="flex items-center justify-between px-2 pb-3 pt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Session live</span>
          <span className="font-mono">drive.resumable/3</span>
        </div>

        <div className="relative overflow-hidden rounded-[1.55rem] border border-border/70 bg-background/82 p-5 sm:p-7">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="flex items-center justify-between gap-3">
            <RouteNode icon={HardDrive} label="Browser" sub="local file" />
            <div className="relative min-w-0 flex-1">
              <div className="h-px w-full bg-border" />
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_16px_rgba(59,130,246,.65)]"
                  animate={{ left: ['0%', '96%'], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 2.6, delay: i * 0.82, repeat: Infinity, ease: 'linear' }}
                />
              ))}
              <div className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-background px-2 py-1 font-mono text-[9px] text-muted-foreground">16 MiB chunks</div>
            </div>
            <RouteNode icon={Cloud} label="Drive" sub="destination" />
          </div>

          <div className="mt-9 border-t border-border/70 pt-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">current object</p>
                <p className="mt-2 max-w-[260px] truncate text-sm font-semibold">chatgpt-magazine.zip.001</p>
              </div>
              <div className="text-right"><p className="text-3xl font-semibold tracking-[-0.05em]">78<span className="text-base text-muted-foreground">%</span></p></div>
            </div>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-secondary">
              <motion.div className="h-full rounded-full bg-primary" initial={{ width: '12%' }} animate={{ width: '78%' }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.5 }} />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border text-[10px] sm:text-xs">
              <SceneMetric label="speed" value="24.8 MB/s" />
              <SceneMetric label="checkpoint" value="545.8 MB" />
              <SceneMetric label="remaining" value="01:18" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 px-1 pt-3 text-[10px] text-muted-foreground sm:text-[11px]">
          <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> range confirmed</span>
          <span className="flex items-center justify-center gap-1.5"><Zap className="h-3 w-3 text-amber-500" /> adaptive</span>
          <span className="flex items-center justify-end gap-1.5"><Wifi className="h-3 w-3 text-primary" /> direct</span>
        </div>
      </div>
    </div>
  )
}

function RouteNode({ icon: Icon, label, sub }: { icon: typeof Cloud; label: string; sub: string }) {
  return (
    <div className="min-w-[84px]">
      <span className="grid h-11 w-11 place-items-center rounded-[0.9rem] border border-border bg-secondary/70 text-foreground shadow-sm"><Icon className="h-5 w-5" /></span>
      <p className="mt-2 text-xs font-semibold">{label}</p>
      <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">{sub}</p>
    </div>
  )
}

function SceneMetric({ label, value }: { label: string; value: string }) {
  return <div className="bg-background p-3"><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-1 font-semibold text-foreground">{value}</p></div>
}

function EngineMap() {
  return (
    <div className="relative flex h-full min-h-[382px] flex-col">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-400">
        <span>transfer trace</span>
        <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> healthy</span>
      </div>

      <div className="relative flex flex-1 items-center justify-between gap-3 py-10">
        <EngineNode icon={HardDrive} label="DEVICE" value="700 MB" />
        <EngineWire delay={0} />
        <EngineNode icon={RefreshCcw} label="SESSION" value="resumable" accent />
        <EngineWire delay={0.8} />
        <EngineNode icon={Cloud} label="GOOGLE DRIVE" value="545.8 MB" />
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-3">
        <DarkMetric label="chunk" value="16 MiB" sub="auto tuned" />
        <DarkMetric label="retry policy" value="5 attempts" sub="exponential backoff" />
        <DarkMetric label="resume point" value="byte 572,313,600" sub="server confirmed" />
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-[10px] leading-6 text-slate-400">
        <p><span className="text-blue-300">18:42:11</span> PUT bytes 555536384-572313599/734003200</p>
        <p><span className="text-blue-300">18:42:13</span> 308 Resume Incomplete · range=0-572313599</p>
        <p className="flex items-center gap-1.5 text-emerald-300"><Check className="h-3 w-3" /> checkpoint persisted · next chunk ready</p>
      </div>
    </div>
  )
}

function EngineNode({ icon: Icon, label, value, accent = false }: { icon: typeof Cloud; label: string; value: string; accent?: boolean }) {
  return (
    <div className="relative z-10 w-[92px] shrink-0 text-center sm:w-[112px]">
      <span className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl border ${accent ? 'border-blue-400/40 bg-blue-400/10 text-blue-200 shadow-[0_0_38px_-8px_rgba(96,165,250,.5)]' : 'border-white/10 bg-white/[0.05] text-slate-200'}`}><Icon className="h-5 w-5" /></span>
      <p className="mt-3 font-mono text-[8px] tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-[11px] font-medium text-slate-200">{value}</p>
    </div>
  )
}

function EngineWire({ delay }: { delay: number }) {
  return (
    <div className="relative min-w-0 flex-1">
      <div className="h-px w-full bg-gradient-to-r from-white/10 via-blue-400/35 to-white/10" />
      <motion.span className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-blue-300 shadow-[0_0_12px_rgba(147,197,253,.9)]" animate={{ left: ['0%', '96%'], opacity: [0, 1, 0] }} transition={{ duration: 2, delay, repeat: Infinity, ease: 'linear' }} />
    </div>
  )
}

function DarkMetric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div className="bg-[#0b1625] p-3.5"><p className="font-mono text-[8px] uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-1 text-xs font-semibold text-white">{value}</p><p className="mt-1 text-[9px] text-slate-500">{sub}</p></div>
}

function PrivacyCell({ icon: Icon, title, text }: { icon: typeof Cloud; title: string; text: string }) {
  return (
    <div className="p-7 sm:p-9 lg:p-10">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-secondary/70 text-primary"><Icon className="h-4.5 w-4.5" /></span>
      <h3 className="mt-7 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  )
}
