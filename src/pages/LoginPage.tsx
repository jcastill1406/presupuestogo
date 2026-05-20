import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle, signUp, signInWithBiometric, isBiometricAvailable } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [bioScanning, setBioScanning] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
        navigate('/')
      } else {
        await signUp(email, password, name)
        setError('Revisa tu correo para confirmar tu cuenta')
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    try { await signInWithGoogle() }
    catch (err: any) { setError(err.message) }
  }

  const handleBiometric = async () => {
    setBioScanning(true)
    setError('')
    try {
      const available = await isBiometricAvailable()
      if (!available) { setError('Biometría no disponible en este dispositivo.'); return }
      const ok = await signInWithBiometric()
      if (ok) navigate('/')
      else setError('Verificación cancelada')
    } catch { setError('Sesión expirada. Inicia sesión con correo primero.') }
    finally { setBioScanning(false) }
  }

  const inp: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'8px 11px', fontSize:13, outline:'none' }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:20 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, padding:'36px 32px', width:'100%', maxWidth:380 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:60, height:60, background:'var(--accent)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', fontSize:26 }}>💰</div>
          <div style={{ fontSize:22, fontWeight:800 }}>Presupuesto<span style={{ color:'var(--accent2)' }}>Go</span></div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Tu dinero, bajo control</div>
        </div>
        <div style={{ display:'flex', gap:4, padding:3, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, marginBottom:20 }}>
          {(['login','register'] as const).map(m => (
            <div key={m} onClick={() => setMode(m)} style={{ flex:1, padding:'7px 8px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, color: mode===m?'#fff':'var(--text2)', background: mode===m?'var(--accent)':'transparent', textAlign:'center', transition:'all .15s' }}>
              {m==='login'?'Iniciar sesión':'Registrarse'}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          {mode==='register' && (
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Nombre completo</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" required style={inp} />
            </div>
          )}
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Correo electrónico</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com" required style={inp} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={inp} />
          </div>
          {error && <div style={{ marginBottom:12, padding:'8px 12px', background:error.includes('correo')?'var(--green-bg)':'var(--red-bg)', border:`1px solid ${error.includes('correo')?'var(--green)':'var(--red)'}`, borderRadius:8, fontSize:12, color:error.includes('correo')?'var(--green)':'var(--red)' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width:'100%', padding:10, background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity:loading?.7:1 }}>
            {loading?'Cargando...':mode==='login'?'Iniciar sesión':'Crear cuenta'}
          </button>
        </form>
        <div style={{ display:'flex', alignItems:'center', gap:10, margin:'14px 0', color:'var(--text3)', fontSize:11 }}>
          <div style={{ flex:1, height:1, background:'var(--border)' }} />o<div style={{ flex:1, height:1, background:'var(--border)' }} />
        </div>
        <button onClick={handleBiometric} disabled={bioScanning} style={{ width:'100%', padding:11, background:bioScanning?'var(--green-bg)':'var(--bg3)', border:`1px solid ${bioScanning?'var(--green)':'var(--border2)'}`, borderRadius:10, color:bioScanning?'var(--green)':'var(--text2)', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:8 }}>
          <span style={{ fontSize:20 }}>👆</span>
          {bioScanning?'Verificando...':'Face ID / Huella digital'}
        </button>
        <button onClick={handleGoogle} style={{ width:'100%', padding:10, background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text2)', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <span style={{ fontSize:16, fontWeight:700, color:'#4285f4' }}>G</span> Continuar con Google
        </button>
        <div style={{ textAlign:'center', marginTop:14, fontSize:11, color:'var(--text3)' }}>🔒 Datos cifrados con AES-256</div>
      </div>
    </div>
  )
}
