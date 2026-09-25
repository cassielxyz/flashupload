import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('flashupload-theme') === 'dark' ? 'dark' : 'light'))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('flashupload-theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b0d10' : '#ffffff')
  }, [theme])

  return { theme, setTheme, toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')) }
}
