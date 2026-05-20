import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'

const CRC = (n: number) => '₡' + Math.round(n).toLocaleString('es-CR')

export default function BalancePage() {
  const { user } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const { transactions, totalIncome, totalExpenses, savings } = useTransactions(user?.id, month, year)
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const savingsRate = totalIncome > 0 ? Math.round(savings / totalIncome * 100) : 0

  const expensesByCategory = transactions
    .filter(t => t.type === 'expense' && !t.is_ignored)
    .reduce((acc, t) => {
      const key = t.category?.name || 'Sin categoría'
      acc[key] = (acc[key] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const topExpenses = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 1 - i, 1)
    return { label: months[d.getMonth()].slice(0,3), month: d.getMonth()+1, year: d.getFullYear() }
  }).reverse()

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <select value={month} onChange={e => setMonth(Number(e.target.value))}
          style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'7px 10px', fontSize:13 }}>
          {months.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'7px 10px', fontSize:13 }}>
          {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:4 }}>📈 Ingresos</div>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--green)' }}>{CRC(totalIncome)}</div>
        </div>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:4 }}>📉 Gastos</div>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--red)' }}>{CRC(totalExpenses)}</div>
        </div>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:4 }}>🏦 Neto</div>
          <div style={{ fontSize:16, fontWeight:700, color: savings>=0?'var(--amber)':'var(--red)' }}>{CRC(savings)}</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>📊 Score financiero</div>
          {[
            { label:'Tasa de ahorro', value:`${savingsRate}%`, status: savingsRate>=20?'Excelente':savingsRate>=10?'Bueno':'Mejorable', color: savingsRate>=20?'var(--green)':savingsRate>=10?'var(--amber)':'var(--red)' },
            { label:'Gastos vs ingresos', value: totalIncome>0?`${Math.round(totalExpenses/totalIncome*100)}%`:'—', status: totalExpenses<=totalIncome*0.7?'Saludable':totalExpenses<=totalIncome?'Ajustado':'Excedido', color: totalExpenses<=totalIncome*0.7?'var(--green)':totalExpenses<=totalIncome?'var(--amber)':'var(--red)' },
            { label:'Movimientos', value: String(transactions.length), status:'Este mes', color:'var(--blue)' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:12, color:'var(--text2)' }}>{r.label}</span>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:13, fontWeight:700 }}>{r.value}</span>
                <span style={{ background:`${r.color}22`, color:r.color, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20 }}>{r.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>🏆 Top gastos</div>
          {topExpenses.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text3)', fontSize:12 }}>Sin gastos este mes</div>
          ) : topExpenses.map(([cat, amt]) => (
            <div key={cat} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:11, fontWeight:600 }}>{cat}</span>
                <span style={{ fontSize:11, fontWeight:700, color:'var(--red)' }}>{CRC(amt)}</span>
              </div>
              <div style={{ height:4, background:'var(--bg3)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:2, background:'var(--red)', width:`${Math.round(amt/totalExpenses*100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
