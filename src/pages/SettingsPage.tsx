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

  const inp: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'8px 11px', fontSize:13, outline:'none' }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>Perfil</div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#fff' }}>
              {profile.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700 }}>{profile.full_name || 'Sin nombre'}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>{user?.email}</div>
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Nombre completo</label>
            <input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Tu nombre" style={inp} />
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Moneda</label>
            <select value={profile.currency} onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))} style={{ ...inp, appearance:'none' as const }}>
              <option value="CRC">Colon costarricense</option>
              <option value="USD">Dolar americano</option>
            </select>
          </div>
          <button onClick={save} disabled={saving} style={{ width:'100%', padding:9, background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, opacity:saving?0.7:1 }}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>API Key SINPE</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginBottom:12 }}>
            Genera una clave permanente para el atajo de iOS. Esta clave no expira.
          </div>
          {apiKey ? (
            <>
              <div style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 12px', fontSize:10, color:'var(--green)', wordBreak:'break-all' as const, marginBottom:10, fontFamily:'monospace' }}>
                {apiKey}
              </div>
              <button onClick={copy} style={{ width:'100%', padding:9, background: copied?'var(--green-bg)':'var(--bg3)', border:`1px solid ${copied?'var(--green)':'var(--border2)'}`, borderRadius:8, color: copied?'var(--green)':'var(--text2)', cursor:'pointer', fontSize:13, fontWeight:700, marginBottom:8 }}>
                {copied ? 'Copiado!' : 'Copiar API Key'}
              </button>
              <button onClick={generateKey} disabled={generating} style={{ width:'100%', padding:9, background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:8, color:'var(--red)', cursor:'pointer', fontSize:12, fontWeight:600, opacity:generating?0.7:1 }}>
                {generating ? 'Generando...' : 'Regenerar clave'}
              </button>
            </>
          ) : (
            <button onClick={generateKey} disabled={generating} style={{ width:'100%', padding:12, background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, opacity:generating?0.7:1 }}>
              {generating ? 'Generando...' : 'Generar API Key'}
            </button>
          )}
          <div style={{ marginTop:12, padding:10, background:'var(--green-bg)', border:'1px solid var(--green-dim)', borderRadius:8 }}>
            <div style={{ fontSize:11, color:'var(--green)', fontWeight:700 }}>Esta clave no expira</div>
            <div style={{ fontSize:11, color:'var(--text2)', marginTop:3 }}>Configurala una sola vez en el atajo de iOS y funcionara siempre.</div>
          </div>
        </div>
      </div>

      {/* Sección Face ID - siempre visible */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>Face ID / Huella digital</div>
        <div style={{ fontSize:12, color:'var(--text2)', marginBottom:12 }}>
          {biometricEnabled
            ? 'Face ID está activado. Puedes usarlo para entrar sin contraseña.'
            : 'Activa Face ID para entrar a la app más rápido sin escribir tu contraseña.'}
        </div>

        {bioMsg && (
          <div style={{ marginBottom:10, padding:'8px 12px', background: bioMsg.includes('correctamente') ? 'var(--green-bg)' : 'var(--red-bg)', border:`1px solid ${bioMsg.includes('correctamente') ? 'var(--green)' : 'var(--red)'}`, borderRadius:8, fontSize:12, color: bioMsg.includes('correctamente') ? 'var(--green)' : 'var(--red)' }}>
            {bioMsg}
          </div>
        )}

        {biometricEnabled ? (
          <button onClick={handleDisableBiometric} style={{ width:'100%', padding:11, background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:10, color:'var(--red)', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <span style={{ fontSize:20 }}>👆</span>
            Desactivar Face ID
          </button>
        ) : (
          <button onClick={handleRegisterBiometric} disabled={registeringBio} style={{ width:'100%', padding:11, background: registeringBio ? 'var(--green-bg)' : 'var(--bg3)', border:`1px solid ${registeringBio ? 'var(--green)' : 'var(--border2)'}`, borderRadius:10, color: registeringBio ? 'var(--green)' : 'var(--text2)', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:registeringBio?0.7:1 }}>
            <span style={{ fontSize:20 }}>👆</span>
            {registeringBio ? 'Activando...' : 'Activar Face ID'}
          </button>
        )}
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>Instalar como app</div>
        <div style={{ fontSize:12, color:'var(--text2)', marginBottom:10 }}>Agrega PresupuestoGo a tu pantalla de inicio para abrirla como una app nativa.</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {[
            { step:'1', text:'Abre presupuestogo.vercel.app en Safari' },
            { step:'2', text:'Toca el boton compartir (cuadrado con flecha)' },
            { step:'3', text:'Selecciona Agregar a pantalla de inicio' },
            { step:'4', text:'Ponle nombre PresupuestoGo y toca Agregar' },
          ].map(s => (
            <div key={s.step} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'var(--bg3)', borderRadius:8 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>{s.step}</div>
              <span style={{ fontSize:12 }}>{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => signOut()} style={{ width:'100%', padding:12, background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:10, color:'var(--red)', cursor:'pointer', fontSize:14, fontWeight:700 }}>
        Cerrar sesion
      </button>
    </div>
  )
}
