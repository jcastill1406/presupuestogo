import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

// Encriptar texto con una clave
async function encryptData(data: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(data)
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  return btoa(String.fromCharCode(...combined))
}

// Desencriptar texto con una clave
async function decryptData(data: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(data), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const encrypted = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)
  return new TextDecoder().decode(decrypted)
}

// Generar clave AES desde un credentialId (identificador único del dispositivo)
async function deriveKey(credentialId: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(credentialId.slice(0, 32).padEnd(32, '0')),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new TextEncoder().encode('presupuestogo'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
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

  // Registrar Face ID y guardar credenciales encriptadas
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

      // Encriptar y guardar las credenciales del usuario
      const storedCreds = localStorage.getItem('presupuestogo_temp_creds')
      if (storedCreds) {
        const key = await deriveKey(credentialId)
        const encrypted = await encryptData(storedCreds, key)
        localStorage.setItem('presupuestogo_encrypted_creds', encrypted)
        localStorage.removeItem('presupuestogo_temp_creds')
      }

      await supabase.from('profiles').update({ biometric_enabled: true }).eq('id', userId)
      return true
    } catch {
      return false
    }
  }, [])

  // Iniciar sesión con Face ID desencriptando las credenciales
  const signInWithBiometric = useCallback(async (): Promise<boolean> => {
    try {
      const credentialId = localStorage.getItem('presupuestogo_biometric_id')
      const encryptedCreds = localStorage.getItem('presupuestogo_encrypted_creds')

      if (!credentialId || !encryptedCreds) {
        throw new Error('No hay biometría registrada. Actívala en Configuración.')
      }

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

      // Face ID exitoso - desencriptar credenciales e iniciar sesión
      const key = await deriveKey(credentialId)
      const decrypted = await decryptData(encryptedCreds, key)
      const { email, password } = JSON.parse(decrypted)

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error('Error al iniciar sesión. Reactiva Face ID en Configuración.')

      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('No hay biometría') || message.includes('Error al iniciar')) throw err
      if (message.includes('cancelled') || message.includes('NotAllowed')) return false
      throw err
    }
  }, [])

  // Guardar credenciales temporalmente antes de registrar Face ID
  const saveTempCredentials = useCallback((email: string, password: string) => {
    localStorage.setItem('presupuestogo_temp_creds', JSON.stringify({ email, password }))
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
    saveTempCredentials,
  }
}
