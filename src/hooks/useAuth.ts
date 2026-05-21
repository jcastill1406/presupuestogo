import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false })
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, loading: false })
    })
    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const isBiometricAvailable = useCallback(async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) return false
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch {
      return false
    }
  }, [])

  const registerBiometric = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32))
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'PresupuestoGo', id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(userId),
            name: userId,
            displayName: 'PresupuestoGo',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: true,
          },
          timeout: 60000,
        },
      }) as PublicKeyCredential

      if (!credential) return false

      const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
      localStorage.setItem('presupuestogo_biometric_id', credentialId)
      localStorage.setItem('presupuestogo_biometric_user', userId)

      // Guardar también el refresh token para renovar sesión después
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.refresh_token) {
        localStorage.setItem('presupuestogo_refresh_token', session.refresh_token)
      }

      await supabase.from('profiles').update({ biometric_enabled: true }).eq('id', userId)
      return true
    } catch {
      return false
    }
  }, [])

  const signInWithBiometric = useCallback(async (): Promise<boolean> => {
    try {
      const credentialId = localStorage.getItem('presupuestogo_biometric_id')
      if (!credentialId) throw new Error('No hay biometría registrada')

      const challenge = crypto.getRandomValues(new Uint8Array(32))
      const rawId = Uint8Array.from(atob(credentialId), c => c.charCodeAt(0))

      // Verificar con Face ID
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
          allowCredentials: [{ type: 'public-key', id: rawId }],
        },
      })

      // Face ID exitoso - intentar renovar sesión con refresh token
      const refreshToken = localStorage.getItem('presupuestogo_refresh_token')
      if (refreshToken) {
        const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
        if (!error && data.session) {
          // Guardar el nuevo refresh token
          localStorage.setItem('presupuestogo_refresh_token', data.session.refresh_token)
          return true
        }
      }

      // Si no hay refresh token o expiró, verificar sesión existente
      const { data: { session } } = await supabase.auth.getSession()
      if (session) return true

      throw new Error('Sesión expirada. Inicia sesión con Google o correo primero.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('No hay biometría') || message.includes('Sesión expirada')) throw err
      if (message.includes('cancelled') || message.includes('NotAllowed')) return false
      throw err
    }
  }, [])

  return {
    ...state,
    signInWithEmail,
    signInWithGoogle,
    signUp,
    signOut,
    isBiometricAvailable,
    registerBiometric,
    signInWithBiometric,
  }
}
