import { cn } from '@/lib/utils'

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)} aria-label="FlashUpload">
      <img
        src="/brand/flashupload-logo.svg"
        alt=""
        className="h-9 w-9 shrink-0 rounded-[0.82rem] drop-shadow-[0_8px_16px_rgba(37,99,235,.18)]"
        aria-hidden="true"
      />
      {!compact && (
        <span className="flex items-baseline gap-1.5">
          <span className="bg-[linear-gradient(90deg,#194be5_0%,#0a9fe8_38%,#12b86a_57%,#f8b51b_73%,#f25a18_87%,#dc1732_100%)] bg-clip-text text-[18px] font-bold tracking-[-0.045em] text-transparent">FlashUpload</span>
          <span className="hidden font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground xl:inline">drive workspace</span>
        </span>
      )}
    </div>
  )
}
