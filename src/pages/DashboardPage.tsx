import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAccounts } from '../hooks/useAccounts'
import { useTransactions } from '../hooks/useTransactions'
import { useReminders } from '../hooks/useReminders'

const CRC = (n: number) => '₡' + Math.round(n).toLocaleString('es-CR')

export default function DashboardPage() {
  const { user } = useAuth()
  const now = new Date()
  const [month] = useState(now.getMonth() + 1)
  const [year] = useState(now.getFullYear())
  const { accounts, totalBalance } = useAccounts(user?.id)
  const { transactions, totalIncome, totalExpenses, savings } = useTransactions(user?.id, month, year)
  const { pending } = useReminders(user?.id)
  const name = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario'
  const savingsRate = totalIncome > 0 ? Math.round(savings / totalIncome * 100) : 0

  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>Hola, {name} 👋</div>
        <div style={{ fontSize:13, color:'var(--text2)' }}>{months[month-1]} {year}</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:16 }}>
        {[
          { label:'Saldo total', value:CRC(totalBalance), color:'var(--text)', icon:'💰', sub:'en todas las cuentas' },
          { label:'Ingresos', value:CRC(totalIncome), color:'var(--green)', icon:'📈', sub:`+${savingsRate}% ahorro` },
          { label:'Gastos', value:CRC(totalExpenses), color:'var(--red)', icon:'📉', sub:`${transactions.filter(t=>t.type==='expense').length} movimientos` },
          { label:'Ahorro neto', value:CRC(savings), color:'var(--amber)', icon:'🏦', sub: savings >= 0 ? 'Positivo ✓' : 'Negativo ⚠️' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize:20, fontWeight:700, color:s.color, marginBottom:3 }}>{s.value}</div>
            <div style={{ fontSize:10, color:'var(--text3)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>💳 Cuentas</div>
          {accounts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'16px 0', color:'var(--text3)', fontSize:12 }}>
              No hay cuentas aún<br/>
              <span style={{ color:'var(--accent2)', cursor:'pointer' }} onClick={() => window.location.href='/cuentas'}>+ Agregar cuenta</span>
            </div>
          ) : accounts.slice(0,3).map(a => (
            <div key={a.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px', background:'var(--bg3)', borderRadius:8, marginBottom:6 }}>
              <span style={{ fontSize:16 }}>{a.type==='credit'?'💳':a.type==='savings'?'🐷':'🏦'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, fontWeight:600 }}>{a.name}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{a.last_four ? `**** ${a.last_four}` : a.type}</div>
              </div>
              <div style={{ fontSize:12, fontWeight:700, color: a.balance < 0 ? 'var(--red)' : 'var(--text)' }}>{CRC(a.balance)}</div>
            </div>
          ))}
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>🔔 Recordatorios</div>
          {pending.length === 0 ? (
            <div style={{ textAlign:'center', padding:'16px 0', color:'var(--text3)', fontSize:12 }}>Sin recordatorios pendientes ✓</div>
          ) : pending.slice(0,3).map(r => (
            <div key={r.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px', background:'var(--bg3)', borderRadius:8, marginBottom:6 }}>
              <span style={{ fontSize:16 }}>{r.type==='payment'?'💳':r.type==='service'?'🏠':'📋'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, fontWeight:600 }}>{r.title}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{r.due_date}</div>
              </div>
              {r.amount ? <div style={{ fontSize:11, fontWeight:700, color:'var(--red)' }}>{CRC(r.amount)}</div> : null}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' }}>💸 Últimos movimientos</div>
          <span style={{ fontSize:11, color:'var(--accent2)', cursor:'pointer' }} onClick={() => window.location.href='/movimientos'}>Ver todos</span>
        </div>
        {transactions.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text3)' }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
            <div style={{ fontSize:13, marginBottom:4 }}>Sin movimientos este mes</div>
            <div style={{ fontSize:12 }}>Registra tu primer gasto o ingreso</div>
          </div>
        ) : transactions.slice(0,6).map(t => (
          <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, cursor:'pointer', transition:'background .15s' }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.background='var(--bg3)'}
            onMouseOut={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
            <div style={{ width:34, height:34, borderRadius:8, background: t.type==='income' ? 'var(--green-bg)' : t.type==='transfer' ? 'var(--blue-bg)' : 'var(--red-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
              {t.type==='income'?'📈':t.type==='transfer'?'🔄':'📉'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.description || t.category?.name || 'Sin descripción'}</div>
              <div style={{ fontSize:10, color:'var(--text3)' }}>{t.account?.name} • {t.date}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:13, fontWeight:700, color: t.type==='income' ? 'var(--green)' : 'var(--red)' }}>
                {t.type==='income'?'+':'-'}{CRC(t.amount)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
