import { Toaster } from 'sonner'
import { Dashboard } from '@/components/dashboard'
import { Landing } from '@/components/landing'
import { LegalPage } from '@/components/legal-page'
import { useGoogleAuth } from '@/hooks/use-google-auth'
import { useTheme, type Theme } from '@/hooks/use-theme'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (path === '/privacy' || path === '/terms') {
    return <>
      <LegalPage kind={path === '/privacy' ? 'privacy' : 'terms'} theme={theme} onToggleTheme={toggleTheme} />
      <Toaster richColors closeButton position="bottom-right" theme={theme} />
    </>
  }

  return <ProductApp theme={theme} onToggleTheme={toggleTheme} />
}

function ProductApp({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const auth = useGoogleAuth()

  return <>
    {auth.connected && auth.profile ? (
      <Dashboard profile={auth.profile} theme={theme} onToggleTheme={onToggleTheme} ensureToken={auth.ensureToken} onDisconnect={auth.disconnect} />
    ) : (
      <>
        <Landing loading={auth.loading} error={auth.error} configured={Boolean(auth.clientId)} theme={theme} onToggleTheme={onToggleTheme} onConnect={() => void auth.connect()} />
        <div className="border-t border-border/70 bg-background px-5 py-4 text-center text-[11px] text-muted-foreground">
          <span>By using FlashUpload you agree to the </span><a href="/terms" className="font-medium text-foreground hover:underline">Terms of Service</a><span> and acknowledge the </span><a href="/privacy" className="font-medium text-foreground hover:underline">Privacy Policy</a>.
        </div>
      </>
    )}
    <Toaster richColors closeButton position="bottom-right" theme={theme} />
  </>
}
