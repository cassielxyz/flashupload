import { cn } from '@/lib/utils'

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)} aria-label="FlashUpload">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[0.9rem] border border-primary/20 bg-primary text-primary-foreground shadow-[0_10px_24px_-14px_rgba(37,99,235,.85)]">
        <span className="absolute inset-x-1.5 top-1.5 h-px bg-white/35" />
        <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="none" aria-hidden="true">
          <path d="M12 17V5m0 0L7.8 9.2M12 5l4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 14.5v2.2A2.3 2.3 0 0 0 7.3 19h9.4a2.3 2.3 0 0 0 2.3-2.3v-2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && (
        <span className="flex items-baseline gap-1.5">
          <span className="text-[17px] font-semibold tracking-[-0.035em]">FlashUpload</span>
          <span className="hidden font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground xl:inline">drive transfer</span>
        </span>
      )}
    </div>
  )
}
