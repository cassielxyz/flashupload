import { Check, Copy, ExternalLink, FileArchive, FileIcon, Pause, Play, RefreshCw, RotateCcw, Trash2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { UploadTask } from '@/hooks/use-upload-manager'
import { formatBytes, formatDuration, formatSpeed } from '@/lib/utils'

export function UploadItem({ task, onPause, onResume, onCancel, onRetry }: { task: UploadTask; onPause: () => void; onResume: () => void; onCancel: () => void; onRetry: () => void }) {
  const percent = task.file.size ? (task.uploadedBytes / task.file.size) * 100 : 0
  const Icon = /zip|rar|7z|tar|gzip|compressed/i.test(task.file.type) || /\.(zip|rar|7z|tar|gz|00\d)$/i.test(task.file.name) ? FileArchive : FileIcon
  const copyLink = async () => {
    if (!task.result?.webViewLink) return
    await navigator.clipboard.writeText(task.result.webViewLink)
    toast.success('Drive link copied')
  }

  return <div className="rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-sm sm:p-5"><div className="flex items-start gap-3 sm:gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground"><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{task.file.name}</p><p className="mt-1 text-xs text-muted-foreground">{formatBytes(task.file.size)} · {statusText(task)}</p></div><div className="flex items-center gap-1">{task.status === 'uploading' && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPause} aria-label="Pause"><Pause className="h-4 w-4" /></Button>}{task.status === 'paused' && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onResume} aria-label="Resume"><Play className="h-4 w-4" /></Button>}{task.status === 'error' && !task.result && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRetry} aria-label="Retry"><RotateCcw className="h-4 w-4" /></Button>}{task.result?.webViewLink && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyLink} aria-label="Copy Drive link"><Copy className="h-4 w-4" /></Button>}{task.result?.webViewLink && <Button asChild variant="ghost" size="icon" className="h-8 w-8"><a href={task.result.webViewLink} target="_blank" rel="noreferrer" aria-label="Open in Drive"><ExternalLink className="h-4 w-4" /></a></Button>}{!['complete', 'canceled'].includes(task.status) && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onCancel} aria-label="Cancel"><Trash2 className="h-4 w-4" /></Button>}</div></div><div className="mt-4"><Progress value={percent} /></div><div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{Math.round(percent)}% · {formatBytes(task.uploadedBytes)} of {formatBytes(task.file.size)}</span><span>{task.status === 'uploading' ? `${formatSpeed(task.speedBytesPerSecond)} · ${formatDuration(task.etaSeconds)} left` : statusMeta(task)}</span></div>{task.error && <p className="mt-3 flex items-start gap-1.5 text-xs text-destructive"><XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{task.error}</p>}</div></div></div>
}

function statusText(task: UploadTask) {
  switch (task.status) {
    case 'queued': return 'Queued'
    case 'preparing': return 'Preparing Drive session'
    case 'uploading': return 'Uploading'
    case 'paused': return 'Paused — safe to resume'
    case 'complete': return 'Uploaded to Drive'
    case 'canceled': return 'Canceled'
    case 'error': return task.result ? 'Uploaded with sharing warning' : 'Needs attention'
  }
}

function statusMeta(task: UploadTask) {
  switch (task.status) {
    case 'queued': return <span className="inline-flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Waiting</span>
    case 'preparing': return 'Creating session…'
    case 'paused': return 'Resume when ready'
    case 'complete': return <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><Check className="h-3 w-3" /> Complete</span>
    case 'canceled': return 'Removed from queue'
    case 'error': return task.result ? 'File is safely in Drive' : 'Retry available'
    default: return ''
  }
}
