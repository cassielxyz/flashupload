import { cn } from '@/lib/utils'

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return <div className={cn('inline-flex items-center gap-2.5', className)} aria-label="FlashUpload"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[conic-gradient(from_210deg,#4285f4,#34a853,#fbbc04,#ea4335,#4285f4)] shadow-sm"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true"><path d="M13.4 2.2 5.6 13h5.2l-.7 8.8 8.3-12.1h-5.5l.5-7.5Z" /></svg></span>{!compact && <span className="text-lg font-semibold tracking-[-0.02em]">FlashUpload</span>}</div>
}
