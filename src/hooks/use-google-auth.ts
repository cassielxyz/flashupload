import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchGoogleProfile, GOOGLE_SCOPE, loadGoogleIdentityScript, revokeGoogleToken, type GoogleProfile } from '@/lib/google-auth'

export function useGoogleAuth() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<GoogleProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tokenExpiresAt = useRef(0)

  useEffect(() => {
    loadGoogleIdentityScript().catch((cause) => setError(cause instanceof Error ? cause.message : 'Google Identity Services failed to load.'))
  }, [])

  const connect = useCallback(async (prompt = 'consent') => {
    if (!clientId) {
      setError('VITE_GOOGLE_CLIENT_ID is not configured.')
      return null
    }
    setLoading(true)
    setError(null)
    try {
      await loadGoogleIdentityScript()
      if (!window.google?.accounts?.oauth2) throw new Error('Google Identity Services is unavailable.')
      const response = await new Promise<GoogleTokenResponse>((resolve, reject) => {
        const client = window.google!.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: GOOGLE_SCOPE,
          callback: (tokenResponse) => {
            if (tokenResponse.error || !tokenResponse.access_token) {
              reject(new Error(tokenResponse.error_description || tokenResponse.error || 'Google sign-in failed.'))
              return
            }
            resolve(tokenResponse)
          },
          error_callback: () => reject(new Error('Google sign-in window was closed or blocked.')),
        })
        client.requestAccessToken({ prompt })
      })
      const token = response.access_token!
      tokenExpiresAt.current = Date.now() + Math.max(0, (response.expires_in ?? 3600) - 60) * 1000
      setAccessToken(token)
      setProfile(await fetchGoogleProfile(token))
      return token
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not connect Google Drive.')
      return null
    } finally {
      setLoading(false)
    }
  }, [clientId])

  const ensureToken = useCallback(async () => {
    if (accessToken && Date.now() < tokenExpiresAt.current) return accessToken
    return connect('')
  }, [accessToken, connect])

  const disconnect = useCallback(async () => {
    if (accessToken) await revokeGoogleToken(accessToken)
    tokenExpiresAt.current = 0
    setAccessToken(null)
    setProfile(null)
    setError(null)
  }, [accessToken])

  return useMemo(() => ({ clientId, accessToken, profile, loading, error, connected: Boolean(accessToken && profile), connect, ensureToken, disconnect }), [clientId, accessToken, profile, loading, error, connect, ensureToken, disconnect])
}
