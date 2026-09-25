import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Theme } from '@/hooks/use-theme'

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return <Button variant="ghost" size="icon" onClick={onToggle} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}</Button>
}
