import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

function GoogleMark() {
  return <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-4V7.3H3a10 10 0 0 0 0 9.4L6.4 14Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.8 9.8 0 0 0 3 7.3L6.4 10c.8-2.4 3-4.1 5.6-4.1Z"/></svg>
}

export function GoogleConnectButton({ loading, onClick, className }: { loading: boolean; onClick: () => void; className?: string }) {
  return <Button size="lg" variant="outline" onClick={onClick} disabled={loading} className={className}>{loading ? <LoaderCircle className="h-4.5 w-4.5 animate-spin" /> : <GoogleMark />}{loading ? 'Connecting…' : 'Continue with Google'}</Button>
}
