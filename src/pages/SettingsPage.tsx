import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function SettingsPage() {
  const { user, signOut, registerBiometric, isBiometricAvailable } = useAuth()
  const [apiKey, setApiKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [profile, setProfile] = useState({ full_name:'', currency:'CRC' })
  const [saving, setSaving] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [registeringBio, setRegisteringBio] = useState(false)
  const [bioMsg, setBioMsg] = useState('')

  useEffect(() => {
    if (user?.id) {
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) setProfile({ full_name: data.full_name || '', currency: data.currency || 'CRC' })
        })
      const stored = localStorage.getItem('pgk_api_key')
      if (stored) setApiKey(stored)

      const bioId = localStorage.getItem('presupuestogo_biometric_id')
      setBiometricEnabled(!!bioId)
    }
  }, [user, isBiometricAvailable])

  const copy = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateKey = async () => {
    setGenerating(true)
    const { data, error } = await supabase.rpc('generate_api_key', {
      p_user_id: user!.id,
      p_name: 'SINPE iOS'
    })
    if (!error && data) {
      setApiKey(data)
      localStorage.setItem('pgk_api_key', data)
    }
    setGenerating(false)
  }

  const save = async () => {
    setSaving(true)
    await supabase.from('profiles').update({ full_name: profile.full_name, currency: profile.currency }).eq('id', user!.id)
    setSaving(false)
  }

  const handleRegisterBiometric = async () => {
    setRegisteringBio(true)
    setBioMsg('')
    try {
      const ok = await registerBiometric(user!.id)
      if (ok) {
        setBiometricEnabled(true)
        setBioMsg('Face ID activado correctamente!')
      } else {
        setBioMsg('No se pudo activar. Intenta de nuevo.')
      }
    } catch {
      setBioMsg('Error al activar Face ID.')
    } finally {
      setRegisteringBio(false)
    }
  }

  const handleDisableBiometric = () => {
    localStorage.removeItem('presupuestogo_biometric_id')
    localStorage.removeItem('presupuestogo_biometric_user')
    setBiometricEnabled(false)
    setBioMsg('Face ID desactivado.')
  }

  const inp: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', p
