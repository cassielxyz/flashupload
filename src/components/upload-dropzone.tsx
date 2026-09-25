import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Cloud, FileUp, FolderUp, HardDrive, Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function UploadDropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const openPicker = () => inputRef.current?.click()

  return (
    <motion.div
      layout
      onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false) }}
      onDrop={(event) => { event.preventDefault(); setDragging(false); onFiles(Array.from(event.dataTransfer.files)) }}
      className={cn(
        'group relative overflow-hidden rounded-[1.75rem] border bg-card/82 transition-all duration-300 hairline-glow backdrop-blur',
        dragging ? 'border-primary/60 bg-primary/[0.045] shadow-[0_30px_80px_-45px_hsl(var(--primary)/.5)]' : 'border-border/75 hover:border-primary/30',
      )}
    >
      <div className="pointer-events-none absolute inset-0 signal-grid opacity-35" />
      <div className="relative grid min-h-[330px] lg:grid-cols-[1.05fr_.95fr]">
        <div className="flex flex-col justify-center border-b border-border/70 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> new transfer
          </div>
          <h2 className="mt-5 max-w-lg text-3xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-4xl">
            Drop the file. The route is already prepared.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
            Files move straight from this browser into Google Drive through a resumable session. FlashUpload never stores the payload.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Button onClick={openPicker} className="h-11 px-5"><Plus className="h-4 w-4" /> Select files</Button>
            <Button variant="outline" onClick={openPicker} className="h-11 bg-background/70 px-4"><FolderUp className="h-4 w-4" /> Add more</Button>
          </div>
          <input ref={inputRef} type="file" multiple className="sr-only" onChange={(event) => event.target.files && onFiles(Array.from(event.target.files))} />
        </div>

        <button type="button" onClick={openPicker} className="relative flex min-h-[250px] items-center justify-center p-6 text-left outline-none sm:p-8" aria-label="Choose files to upload">
          <div className={cn('absolute inset-4 rounded-[1.35rem] border border-dashed transition-all duration-300 sm:inset-5', dragging ? 'border-primary/70 bg-primary/[0.05]' : 'border-border group-hover:border-primary/35')} />
          <div className="relative w-full max-w-md">
            <div className="flex items-center justify-between gap-3">
              <RoutePoint icon={HardDrive} label="Device" sub="local source" />
              <div className="relative flex-1">
                <div className="h-px bg-border" />
                <motion.span className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_14px_hsl(var(--primary)/.6)]" animate={{ left: ['0%', '94%'], opacity: [0, 1, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }} />
                <span className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">resumable chunks</span>
              </div>
              <RoutePoint icon={Cloud} label="My Drive" sub="destination" />
            </div>

            <div className="mt-8 rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><FileUp className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{dragging ? 'Release to add files' : 'Drop anywhere in this panel'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">No artificial FlashUpload size cap</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> direct route</span>
              <span>Google Drive account limits still apply</span>
            </div>
          </div>
        </button>
      </div>
    </motion.div>
  )
}

function RoutePoint({ icon: Icon, label, sub }: { icon: typeof Cloud; label: string; sub: string }) {
  return (
    <div className="w-[76px] shrink-0 sm:w-[86px]">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background text-foreground shadow-sm"><Icon className="h-4.5 w-4.5" /></span>
      <p className="mt-2 text-[11px] font-semibold">{label}</p>
      <p className="mt-0.5 font-mono text-[8px] text-muted-foreground">{sub}</p>
    </div>
  )
}
