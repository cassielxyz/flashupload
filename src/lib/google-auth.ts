const GIS_SRC = 'https://accounts.google.com/gsi/client'
export const GOOGLE_SCOPE = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive.file'].join(' ')

export type GoogleProfile = { sub: string; name: string; email: string; picture?: string }

let scriptPromise: Promise<void> | null = null

export function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services.')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services.'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!response.ok) throw new Error('Google profile could not be loaded.')
  return response.json() as Promise<GoogleProfile>
}

export function revokeGoogleToken(token: string) {
  return new Promise<void>((resolve) => {
    if (!window.google?.accounts?.oauth2) return resolve()
    window.google.accounts.oauth2.revoke(token, resolve)
  })
}
