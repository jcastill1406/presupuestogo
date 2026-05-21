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
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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
      const available = await isBiometricAvailable()
      if (!available) throw new Error('Biometría no disponible en este dispositivo')

      const challenge = crypto.getRandomValues(new Uint8Array(32))
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'PresupuestoGo',
            id: window.location.hostname,
          },
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

      if (!credential) throw new Error('No se pudo registrar la biometría')

      const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
      const { error } = await supabase
        .from('profiles')
        .update({ biometric_enabled: true })
        .eq('id', userId)

      if (error) throw error

      localStorage.setItem('presupuestogo_biometric_id', credentialId)
      localStorage.setItem('presupuestogo_biometric_user', userId)

      return true
    } catch (err) {
      console.error('Error registrando biometría:', err)
      return false
    }
  }, [isBiometricAvailable])

  const signInWithBiometric = useCallback(async (): Promise<boolean> => {
    try {
      const available = await isBiometricAvailable()
      if (!available) throw new Error('Biometría no disponible')

      const challenge = crypto.getRandomValues(new Uint8Array(32))

      // Fix para iOS: allowCredentials vacío activa Face ID automáticamente
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
          allowCredentials: [],
        },
      })

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sesión expirada — inicia sesión con contraseña')

      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      if (message.includes('cancelled') || message.includes('NotAllowedError')) {
        return false
      }
      throw err
    }
  }, [isBiometricAvailable])

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
