import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const [token, setToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [profile, setProfile] = useState({ full_name:'', currency:'CRC' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token || '')
    })
    if (user?.id) {
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => { if (data) setProfile({ full_name: data.full_name || '', currency: data.currency || 'CRC' }) })
    }
  }, [user])

  const copy = () => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const save = async () => {
    setSaving(true)
    await supabase.from('profiles').update({ full_name: profile.full_name, currency: profile.currency }).eq('id', user!.id)
    setSaving(false)
  }

  const inp: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'8px 11px', fontSize:13, outline:'none' }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>👤 Perfil</div>
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
            <select value={profile.currency} onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))} style={{ ...inp, appearance:'none' }}>
              <option value="CRC">₡ Colón costarricense</option>
              <option value="USD">$ Dólar americano</option>
            </select>
          </div>
          <button onClick={save} disabled={saving} style={{ width:'100%', padding:9, background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, opacity:saving?.7:1 }}>
            {saving ? 'Guardando...' : '💾 Guardar cambios'}
          </button>
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>🔑 Token SINPE</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginBottom:10 }}>Usa este token par
cat > ~/Desktop/presupuestogo/src/pages/SettingsPage.tsx << 'EOF'
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const [token, setToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [profile, setProfile] = useState({ full_name:'', currency:'CRC' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token || '')
    })
    if (user?.id) {
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => { if (data) setProfile({ full_name: data.full_name || '', currency: data.currency || 'CRC' }) })
    }
  }, [user])

  const copy = () => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const save = async () => {
    setSaving(true)
    await supabase.from('profiles').update({ full_name: profile.full_name, currency: profile.currency }).eq('id', user!.id)
    setSaving(false)
  }

  const inp: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'8px 11px', fontSize:13, outline:'none' }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>👤 Perfil</div>
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
            <select value={profile.currency} onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))} style={{ ...inp, appearance:'none' }}>
              <option value="CRC">₡ Colón costarricense</option>
              <option value="USD">$ Dólar americano</option>
            </select>
          </div>
          <button onClick={save} disabled={saving} style={{ width:'100%', padding:9, background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, opacity:saving?.7:1 }}>
            {saving ? 'Guardando...' : '💾 Guardar cambios'}
          </button>
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>🔑 Token SINPE</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginBottom:10 }}>Usa este token para configurar el atajo de iOS que registra tus SINPE automáticamente.</div>
          <div style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 12px', fontSize:10, color:'var(--text3)', wordBreak:'break-all', marginBottom:10, maxHeight:80, overflow:'hidden' }}>
            {token ? token.slice(0,40) + '...' : 'Cargando...'}
          </div>
          <button onClick={copy} style={{ width:'100%', padding:9, background: copied?'var(--green-bg)':'var(--bg3)', border:`1px solid ${copied?'var(--green)':'var(--border2)'}`, borderRadius:8, color: copied?'var(--green)':'var(--text2)', cursor:'pointer', fontSize:13, fontWeight:700 }}>
            {copied ? '✓ Copiado!' : '📋 Copiar token completo'}
          </button>
          <div style={{ marginTop:10, padding:10, background:'var(--amber-bg)', border:'1px solid var(--amber)', borderRadius:8 }}>
            <div style={{ fontSize:11, color:'var(--amber)', fontWeight:700 }}>⚠️ Importante</div>
            <div style={{ fontSize:11, color:'var(--text2)', marginTop:3 }}>Este token expira cada hora. Si el atajo deja de funcionar, cópialo de nuevo aquí.</div>
          </div>
        </div>
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>📱 Instalar como app (PWA)</div>
        <div style={{ fontSize:12, color:'var(--text2)', marginBottom:10 }}>Agrega PresupuestoGo a tu pantalla de inicio para abrirla como una app nativa.</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {[
            { step:'1', text:'Abre presupuestogo.vercel.app en Safari' },
            { step:'2', text:'Toca el botón compartir (cuadrado con flecha)' },
            { step:'3', text:'Selecciona "Agregar a pantalla de inicio"' },
            { step:'4', text:'Ponle nombre "PresupuestoGo" y toca Agregar' },
          ].map(s => (
            <div key={s.step} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'var(--bg3)', borderRadius:8 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>{s.step}</div>
              <span style={{ fontSize:12 }}>{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => signOut()} style={{ width:'100%', padding:12, background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:10, color:'var(--red)', cursor:'pointer', fontSize:14, fontWeight:700 }}>
        🚪 Cerrar sesión
      </button>
    </div>
  )
}
