import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { path:'/', label:'Dashboard', icon:'📊' },
  { path:'/movimientos', label:'Movimientos', icon:'💸' },
  { path:'/cuentas', label:'Cuentas', icon:'💳' },
  { path:'/presupuesto', label:'Presupuesto', icon:'🎯' },
  { path:'/planificador', label:'Planificador', icon:'📅' },
  { path:'/objetivos', label:'Objetivos', icon:'🏆' },
  { path:'/balance', label:'Balance', icon:'⚖️' },
  { path:'/recordatorios', label:'Recordatorios', icon:'🔔', badge:3 },
  { path:'/calculadoras', label:'Calculadoras', icon:'🧮' },
  { path:'/viaje', label:'Modo Viaje', icon:'✈️' },
  { path:'/integraciones', label:'Integraciones', icon:'🔌' },
  { path:'/informes', label:'Informes', icon:'📈' },
]

const titles: Record<string,string> = {
  '/':'Dashboard','/movimientos':'Movimientos','/cuentas':'Cuentas',
  '/presupuesto':'Presupuesto','/planificador':'Planificador',
  '/objetivos':'Objetivos','/balance':'Balance','/recordatorios':'Recordatorios',
  '/calculadoras':'Calculadoras','/viaje':'Modo Viaje',
  '/integraciones':'Integraciones','/informes':'Informes',
}

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const initials = user?.user_metadata?.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()||'U'
  const isMobile = window.innerWidth < 768

  const goTo = (path: string) => { navigate(path); setOpen(false) }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {open && <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:400 }} />}
      <nav style={{ width:240, background:'var(--bg2)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink:0, position:isMobile?'fixed':'relative', top:0, bottom:0, left:0, transform:isMobile&&!open?'translateX(-100%)':'none', transition:'transform .3s', zIndex:500 }}>
        <div style={{ padding:'18px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid var(--border)' }}>
          <div style={{ width:36, height:36, background:'var(--accent)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>💰</div>
          <div style={{ fontSize:16, fontWeight:800 }}>Presupuesto<span style={{ color:'var(--accent2)' }}>Go</span></div>
        </div>
        <div style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
          {navItems.map(item => (
            <div key={item.path} onClick={()=>goTo(item.path)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, cursor:'pointer', marginBottom:2, background:location.pathname===item.path?'var(--accent-dim)':'transparent', color:location.pathname===item.path?'#fff':'var(--text2)', transition:'all .15s' }}>
              <span style={{ fontSize:16, width:22, textAlign:'center' }}>{item.icon}</span>
              <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{item.label}</span>
              {item.badge && <span style={{ background:'var(--red)', color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:20 }}>{item.badge}</span>}
            </div>
          ))}
        </div>
        <div style={{ padding:'10px 8px', borderTop:'1px solid var(--border)' }}>
          <div onClick={()=>signOut()} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, cursor:'pointer', color:'var(--red)' }}>
            <span>🚪</span><span style={{ fontSize:13, fontWeight:600 }}>Cerrar sesión</span>
          </div>
        </div>
      </nav>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <div style={{ height:54, background:'var(--bg2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, padding:'0 16px', flexShrink:0 }}>
          <div onClick={()=>setOpen(!open)} style={{ width:34, height:34, borderRadius:8, border:'1px solid var(--border2)', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:18 }}>☰</div>
          <div style={{ fontSize:15, fontWeight:700, flex:1 }}>{titles[location.pathname]||'PresupuestoGo'}</div>
          <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{initials}</div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:16, background:'var(--bg)' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<Placeholder />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const name = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario'
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>Hola, {name} 👋</div>
        <div style={{ fontSize:13, color:'var(--text2)' }}>Bienvenido a PresupuestoGo</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:20 }}>
        {[{label:'Saldo total',value:'₡0',color:'var(--text)',icon:'💰'},{label:'Ingresos mayo',value:'₡0',color:'var(--green)',icon:'📈'},{label:'Gastos mayo',value:'₡0',color:'var(--red)',icon:'📉'},{label:'Ahorro',value:'₡0',color:'var(--amber)',icon:'🏦'}].map(s=>(
          <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>Backend conectado exitosamente</div>
        <div style={{ fontSize:13, color:'var(--text2)', marginBottom:16 }}>Supabase funcionando correctamente.</div>
        <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
          {['Base de datos ✅','Autenticación ✅','RLS activado ✅','Triggers ✅'].map(t=>(
            <span key={t} style={{ background:'var(--green-bg)', border:'1px solid var(--green)', borderRadius:20, padding:'4px 12px', fontSize:12, color:'var(--green)', fontWeight:600 }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Placeholder() {
  const location = useLocation()
  const titles: Record<string,string> = {'/movimientos':'Movimientos 💸','/cuentas':'Cuentas 💳','/presupuesto':'Presupuesto 🎯','/planificador':'Planificador 📅','/objetivos':'Objetivos 🏆','/balance':'Balance ⚖️','/recordatorios':'Recordatorios 🔔','/calculadoras':'Calculadoras 🧮','/viaje':'Modo Viaje ✈️','/integraciones':'Integraciones 🔌','/informes':'Informes 📈'}
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, textAlign:'center', color:'var(--text3)' }}>
      <div style={{ fontSize:16, fontWeight:700, color:'var(--text2)', marginBottom:6 }}>{titles[location.pathname]||'Sección'}</div>
      <div style={{ fontSize:13 }}>Se conectará a Supabase en el siguiente paso</div>
    </div>
  )
}
