import { useEffect } from 'react'
import Lenis from 'lenis'
import { motion } from 'framer-motion'
import { ArrowRight, CloudUpload, Gauge, RefreshCcw, ShieldCheck, Sparkles } from 'lucide-react'
import { Brand } from '@/components/brand'
import { GoogleConnectButton } from '@/components/google-connect-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Theme } from '@/hooks/use-theme'

const features = [
  { icon: RefreshCcw, title: 'Resumable by design', text: 'Large files upload in Drive-compatible chunks, with retries and server-confirmed resume points.' },
  { icon: Gauge, title: 'Adaptive throughput', text: 'Chunk size responds to measured throughput, while multiple files can upload concurrently.' },
  { icon: ShieldCheck, title: 'Direct to your Drive', text: 'File bytes go from your browser to Google Drive. FlashUpload never stores your uploads on an app server.' },
]

export function Landing({ loading, error, configured, theme, onToggleTheme, onConnect }: { loading: boolean; error: string | null; configured: boolean; theme: Theme; onToggleTheme: () => void; onConnect: () => void }) {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true })
    let frame = 0
    const raf = (time: number) => { lenis.raf(time); frame = requestAnimationFrame(raf) }
    frame = requestAnimationFrame(raf)
    return () => { cancelAnimationFrame(frame); lenis.destroy() }
  }, [])

  return <div className="min-h-screen overflow-hidden bg-background text-foreground">
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/82 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8"><Brand /><div className="flex items-center gap-2"><ThemeToggle theme={theme} onToggle={onToggleTheme} /><Button size="sm" onClick={onConnect}>Open uploader <ArrowRight className="h-4 w-4" /></Button></div></div></header>
    <main>
      <section className="relative mx-auto flex min-h-[94vh] max-w-7xl items-center px-5 pb-20 pt-28 lg:px-8"><div className="pointer-events-none absolute left-1/2 top-24 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" /><div className="relative grid w-full gap-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }}><Badge className="mb-5 gap-1.5 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"><Sparkles className="h-3.5 w-3.5" /> Direct-to-Drive upload engine</Badge><h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-6xl lg:text-7xl">Big uploads. <span className="text-primary">Less restarting.</span></h1><p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">A Drive-familiar uploader for huge files, unstable networks, and long transfers. Resumable chunks, retries, live speed, ETA, and optional link sharing.</p><div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center"><GoogleConnectButton loading={loading} onClick={onConnect} /><span className="text-xs text-muted-foreground">Uses the narrow <code>drive.file</code> permission.</span></div>{!configured && <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">Google OAuth client ID is not configured yet. Follow the README deployment steps.</p>}{error && <p className="mt-3 text-sm text-destructive">{error}</p>}</motion.div>
        <motion.div initial={{ opacity: 0, scale: .95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: .12, duration: .7, ease: [0.22, 1, 0.36, 1] }}><Card className="relative overflow-hidden rounded-[2rem] border-border/80 bg-card/85 p-5 shadow-float backdrop-blur sm:p-7"><div className="flex items-center justify-between border-b border-border pb-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><CloudUpload className="h-5 w-5" /></span><div><p className="font-medium">Upload queue</p><p className="text-xs text-muted-foreground">2 files · 1.4 GB</p></div></div><Badge>Live</Badge></div><div className="space-y-4 pt-5">{[['archive-part-01.zip','78%','24.8 MB/s','78%'],['archive-part-02.zip','43%','22.1 MB/s','43%']].map(([name, pct, speed, width]) => <div key={name} className="rounded-2xl border border-border bg-background/70 p-4"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{name}</p><p className="mt-1 text-xs text-muted-foreground">{speed} · resumable</p></div><span className="text-sm font-medium">{pct}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width }} /></div></div>)}</div><div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs"><div className="rounded-xl bg-secondary/60 p-3"><p className="text-muted-foreground">Combined</p><p className="mt-1 font-semibold">46.9 MB/s</p></div><div className="rounded-xl bg-secondary/60 p-3"><p className="text-muted-foreground">Chunks</p><p className="mt-1 font-semibold">Adaptive</p></div><div className="rounded-xl bg-secondary/60 p-3"><p className="text-muted-foreground">Route</p><p className="mt-1 font-semibold">Browser → Drive</p></div></div></Card></motion.div>
      </div></section>
      <section id="features" className="mx-auto max-w-7xl px-5 py-24 lg:px-8"><motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} className="mb-10 max-w-2xl"><p className="text-sm font-semibold text-primary">Built for real network conditions</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Fast when your connection is fast. Resilient when it isn’t.</h2></motion.div><div className="grid gap-4 md:grid-cols-3">{features.map((feature, index) => <motion.div key={feature.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }}><Card className="h-full p-6"><feature.icon className="h-6 w-6 text-primary" /><h3 className="mt-8 text-lg font-semibold">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p></Card></motion.div>)}</div></section>
    </main>
    <footer className="border-t border-border py-8"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><Brand compact /><p>FlashUpload does not proxy or store uploaded file bytes.</p></div></footer>
  </div>
}
