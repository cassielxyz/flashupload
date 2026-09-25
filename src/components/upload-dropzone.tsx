import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FileUp, FolderUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function UploadDropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  return <motion.div layout onDragEnter={(event) => { event.preventDefault(); setDragging(true) }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false) }} onDrop={(event) => { event.preventDefault(); setDragging(false); onFiles(Array.from(event.dataTransfer.files)) }} className={cn('group relative overflow-hidden rounded-[1.6rem] border border-dashed bg-card p-7 transition-all sm:p-10', dragging ? 'border-primary bg-primary/5 shadow-float' : 'border-border hover:border-primary/45')}>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/.08),transparent_48%)] opacity-0 transition-opacity group-hover:opacity-100" />
    <div className="relative flex flex-col items-center text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><FileUp className="h-7 w-7" /></span>
      <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em]">Drop large files here</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Uploads go directly from this browser to your Google Drive using resumable sessions.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2"><Button onClick={() => inputRef.current?.click()}><Plus className="h-4 w-4" /> Select files</Button><Button variant="outline" onClick={() => inputRef.current?.click()}><FolderUp className="h-4 w-4" /> Add more</Button></div>
      <input ref={inputRef} type="file" multiple className="sr-only" onChange={(event) => event.target.files && onFiles(Array.from(event.target.files))} />
      <p className="mt-5 text-xs text-muted-foreground">No artificial FlashUpload file-size limit. Google Drive account limits still apply.</p>
    </div>
  </motion.div>
}
