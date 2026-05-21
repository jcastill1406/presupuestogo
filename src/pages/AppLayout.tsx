import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import DashboardPage from './DashboardPage'
import TransactionsPage from './TransactionsPage'
import AccountsPage from './AccountsPage'
import BudgetPage from './BudgetPage'
import PlannerPage from './PlannerPage'
import GoalsPage from './GoalsPage'
import BalancePage from './BalancePage'
import RemindersPage from './RemindersPage'
import CalculatorsPage from './CalculatorsPage'
import ReportsPage from './ReportsPage'
import SettingsPage from './SettingsPage'

const navItems = [
  { path:'/', label:'Dashboard', icon:'📊' },
  { path:'/movimientos', label:'Movimientos', icon:'💸' },
  { path:'/cuentas', label:'Cuentas', icon:'💳' },
  { path:'/presupuesto', label:'Presupuesto', icon:'🎯' },
  { path:'/planificador', label:'Planificador', icon:'📅' },
  { path:'/objetivos', label:'Objetivos', icon:'🏆' },
  { path:'/balance', label:'Balance', icon:'⚖️' },
  { path:'/recordatorios', label:'Recordatorios', icon:'🔔' },
  { path:'/calculadoras', label:'Calculadoras', icon:'🧮' },
  { path:'/informes', label:'Informes', icon:'📈' },
  { path:'/ajustes', label:'Ajustes', icon:'⚙️' },
]

const titles: Record<string,string> = {
  '/':'Dashboard','/ajustes':'Ajustes','/movimientos':'Movimientos','/cuentas':'Cuentas',
  '/presupuesto':'Presupuesto','/planificador':'Planificador',
  '/objetivos':'Objetivos','/balance':'Balance','/recordatorios':'Recordatorios',
  '/calculadoras':'Calculadoras','/informes':'Informes',
}

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const initials = user?.user_metadata?.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
  const isMobile = window.innerWidth < 768

  const goTo = (path: string) => { navigate(path); setOpen(false) }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {open && <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:400 }} />}

      <nav style={{ width:240, background:'var(--bg2)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink:0, position:isMobile?'fixed':'relative', top:0, bottom:0, left:0, transform:isMobile&&!open?'translateX(-100%)':'none', transition:'transform .3s', zIndex:500 }}>
        <div style={{ padding:'18px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid var(--border)' }}>
          <div style={{ width:36, height:36, background:'var(--accent)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>💰</div>
          <div style={{ fontSize:16, fontWeight:800 }}>Presupuesto<span style={{ color:'var(--accent2)' }}>Go</span></div>
        </div>

        <div style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
          {navItems.map(item => (
            <div key={item.path} onClick={() => goTo(item.path)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, cursor:'pointer', marginBottom:2, background:location.pathname===item.path?'var(--accent-dim)':'transparent', color:location.pathname===item.path?'#fff':'var(--text2)', transition:'all .15s' }}>
              <span style={{ fontSize:16, width:22, textAlign:'center' }}>{item.icon}</span>
              <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{item.label}</span>
            </div>
          ))}
        </div>

        <div style={{ padding:'10px 8px', borderTop:'1px solid var(--border)' }}>
          <div onClick={() => signOut()} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, cursor:'pointer', color:'var(--red)' }}>
            <span>🚪</span><span style={{ fontSize:13, fontWeight:600 }}>Cerrar sesión</span>
          </div>
        </div>
      </nav>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <div style={{ height:54, background:'var(--bg2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, padding:'0 16px', flexShrink:0 }}>
          <div onClick={() => setOpen(!open)} style={{ width:34, height:34, borderRadius:8, border:'1px solid var(--border2)', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:18 }}>☰</div>
          <div style={{ fontSize:15, fontWeight:700, flex:1 }}>{titles[location.pathname]||'PresupuestoGo'}</div>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{initials}</div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:16, background:'var(--bg)' }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/movimientos" element={<TransactionsPage />} />
            <Route path="/cuentas" element={<AccountsPage />} />
            <Route path="/presupuesto" element={<BudgetPage />} />
            <Route path="/planificador" element={<PlannerPage />} />
            <Route path="/objetivos" element={<GoalsPage />} />
            <Route path="/balance" element={<BalancePage />} />
            <Route path="/recordatorios" element={<RemindersPage />} />
            <Route path="/calculadoras" element={<CalculatorsPage />} />
            <Route path="/informes" element={<ReportsPage />} />
            <Route path="/ajustes" element={<SettingsPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
