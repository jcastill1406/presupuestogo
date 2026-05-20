import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import TransactionModal from './TransactionModal'
import { supabase } from '../lib/supabase'

const CRC = (n: number) => '₡' + Math.round(n).toLocaleString('es-CR')

export default function TransactionsPage() {
  const { user } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [modal, setModal] = useState<'expense'|'income'|'transfer'|null>(null)
  const [filter, setFilter] = useState<'all'|'expense'|'income'|'transfer'>('all')
  const { transactions, totalIncome, totalExpenses, savings, refetch } = useTransactions(user?.id, month, year)

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  async function deleteTransaction(id: string) {
    if (!confirm('¿Eliminar este movimiento?')) return
    await supabase.from('transactions').delete().eq('id', id)
    refetch()
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', gap:4, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:3 }}>
          {months.map((m, i) => (
            <div key={i} onClick={() => setMonth(i+1)}
              style={{ padding:'4px 8px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:700, background: month===i+1?'var(--accent)':'transparent', color: month===i+1?'#fff':'var(--text2)' }}>
              {m}
            </div>
          ))}
        </div>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'6px 10px', fontSize:12 }}>
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
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:4 }}>🏦 Ahorro</div>
          <div style={{ fontSize:16, fontWeight:700, color: savings >= 0 ? 'var(--amber)' : 'var(--red)' }}>{CRC(savings)}</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, padding:3, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, marginBottom:14 }}>
        {(['all','expense','income','transfer'] as const).map(f => (
          <div key={f} onClick={() => setFilter(f)}
            style={{ flex:1, padding:'6px 8px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, background: filter===f?'var(--accent)':'transparent', color: filter===f?'#fff':'var(--text2)', textAlign:'center' }}>
            {f==='all'?'Todos':f==='expense'?'Gastos':f==='income'?'Ingresos':'Transfer.'}
          </div>
        ))}
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:8 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text3)' }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
            <div style={{ fontSize:13 }}>Sin movimientos</div>
          </div>
        ) : filtered.map(t => (
          <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, cursor:'pointer', transition:'background .15s' }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.background='var(--bg3)'}
            onMouseOut={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
            <div style={{ width:34, height:34, borderRadius:8, background: t.type==='income'?'var(--green-bg)':t.type==='transfer'?'var(--blue-bg)':'var(--red-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
              {t.type==='income'?'📈':t.type==='transfer'?'🔄':'📉'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.description || t.category?.name || 'Sin descripción'}</div>
              <div style={{ fontSize:10, color:'var(--text3)' }}>{t.account?.name} • {t.date}{t.is_recurrent?' • 🔄':''}{t.is_ignored?' • 👁️':''}</div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color: t.type==='income'?'var(--green)':'var(--red)' }}>
                {t.type==='income'?'+':'-'}{CRC(t.amount)}
              </div>
              <div style={{ fontSize:10, color:'var(--text3)' }}>{t.date}</div>
            </div>
            <div onClick={() => deleteTransaction(t.id)}
              style={{ width:28, height:28, borderRadius:6, background:'var(--red-bg)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, fontSize:14 }}>🗑️</div>
          </div>
        ))}
      </div>

      <div style={{ position:'sticky', bottom:0, padding:'12px 0', background:'linear-gradient(to top,var(--bg) 60%,transparent)', display:'flex', justifyContent:'flex-end', gap:8, flexWrap:'wrap' }}>
        <button onClick={() => setModal('income')} style={{ padding:'8px 14px', background:'var(--green-bg)', border:'1px solid var(--green)', borderRadius:8, color:'var(--green)', cursor:'pointer', fontSize:12, fontWeight:700 }}>📈 Ingreso</button>
        <button onClick={() => setModal('transfer')} style={{ padding:'8px 14px', background:'var(--blue-bg)', border:'1px solid var(--blue)', borderRadius:8, color:'var(--blue)', cursor:'pointer', fontSize:12, fontWeight:700 }}>🔄 SINPE</button>
        <button onClick={() => setModal('expense')} style={{ padding:'9px 18px', background:'var(--accent)', border:'none', borderRadius:24, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>＋ Nuevo gasto</button>
      </div>

      {modal && <TransactionModal type={modal} onClose={() => setModal(null)} onSaved={refetch} />}
    </div>
  )
}
