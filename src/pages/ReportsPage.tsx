import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import { useAccounts } from '../hooks/useAccounts'

const CRC = (n: number) => '₡' + Math.round(n).toLocaleString('es-CR')

export default function ReportsPage() {
  const { user } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const { transactions, totalIncome, totalExpenses } = useTransactions(user?.id, month, year)
  const { accounts, totalBalance } = useAccounts(user?.id)
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  function exportCSV() {
    const rows = [
      ['Fecha','Tipo','Descripción','Categoría','Cuenta','Monto'],
      ...transactions.map(t => [
        t.date, t.type, t.description||'', t.category?.name||'', t.account?.name||'', t.amount
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `presupuestogo-${year}-${String(month).padStart(2,'0')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8 }}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'7px 10px', fontSize:13 }}>
            {months.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'7px 10px', fontSize:13 }}>
            {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={exportCSV} style={{ padding:'9px 16px', background:'var(--green-bg)', border:'1px solid var(--green)', borderRadius:8, color:'var(--green)', cursor:'pointer', fontSize:13, fontWeight:700 }}>
          📥 Exportar CSV
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:14 }}>
        {[
          { label:'Saldo total', val:CRC(totalBalance), color:'var(--text)', icon:'💰' },
          { label:'Ingresos', val:CRC(totalIncome), color:'var(--green)', icon:'📈' },
          { label:'Gastos', val:CRC(totalExpenses), color:'var(--red)', icon:'📉' },
          { label:'Movimientos', val:String(transactions.length), color:'var(--blue)', icon:'📋' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:4 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize:16, fontWeight:700, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14, marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:10 }}>🏦 Cuentas</div>
        {accounts.map(a => (
          <div key={a.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontSize:12 }}>{a.name}</span>
            <span style={{ fontSize:12, fontWeight:700, color: a.balance<0?'var(--red)':'var(--text)' }}>{CRC(a.balance)}</span>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:10 }}>📋 Todos los movimientos</div>
        {transactions.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text3)', fontSize:12 }}>Sin movimientos este mes</div>
        ) : transactions.map(t => (
          <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontSize:16 }}>{t.type==='income'?'📈':t.type==='transfer'?'🔄':'📉'}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:600 }}>{t.description || t.category?.name || 'Sin descripción'}</div>
              <div style={{ fontSize:10, color:'var(--text3)' }}>{t.date} • {t.account?.name}</div>
            </div>
            <span style={{ fontSize:12, fontWeight:700, color: t.type==='income'?'var(--green)':'var(--red)' }}>
              {t.type==='income'?'+':'-'}{CRC(t.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
