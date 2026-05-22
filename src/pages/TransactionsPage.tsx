import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import TransactionModal from './TransactionModal'
import { supabase } from '../lib/supabase'
import type { Transaction } from '../types/database'

const CRC = (n: number) => '₡' + Math.round(n).toLocaleString('es-CR')

function TransactionDetail({ t, onClose, onDelete }: { t: Transaction, onClose: () => void, onDelete: () => void }) {
  const color = t.type === 'income' ? 'var(--green)' : t.type === 'transfer' ? 'var(--blue)' : 'var(--red)'
  const bgColor = t.type === 'income' ? 'var(--green-bg)' : t.type === 'transfer' ? 'var(--blue-bg)' : 'var(--red-bg)'
  const icon = t.type === 'income' ? '📈' : t.type === 'transfer' ? '🔄' : '📉'
  const typeLabel = t.type === 'income' ? 'Ingreso' : t.type === 'transfer' ? 'Transferencia' : 'Gasto'

  const row = (label: string, value: string | undefined | null) => value ? (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:12, color:'var(--text3)', fontWeight:600 }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:600, maxWidth:'60%', textAlign:'right' }}>{value}</span>
    </div>
  ) : null

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px 12px 0 0', width:'100%', maxWidth:520, maxHeight:'85vh', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:bgColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
          <div style={{ fontSize:14, fontWeight:700, flex:1 }}>Detalle del movimiento</div>
          <div onClick={onClose} style={{ cursor:'pointer', color:'var(--text3)', fontSize:22 }}>×</div>
        </div>

        <div style={{ padding:18, overflowY:'auto', flex:1 }}>

          {/* Monto destacado */}
          <div style={{ textAlign:'center', padding:'20px 0 24px', borderBottom:'1px solid var(--border)', marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:6 }}>{typeLabel}</div>
            <div style={{ fontSize:32, fontWeight:800, color }}>
              {t.type === 'income' ? '+' : '-'}{CRC(t.amount)}
            </div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>{t.date}</div>
          </div>

          {/* Detalles */}
          <div style={{ marginTop:8 }}>
            {row('Descripción', t.description)}
            {row('Cuenta', t.account?.name)}
            {row('Categoría', t.category?.name)}
            {row('Lugar', t.location)}
            {row('Observación', t.notes)}
            {row('Referencia', t.labels?.length ? t.labels.join(', ') : null)}
            {row('Recordatorio', t.remind_at)}
            {t.is_recurrent && row('Recurrente', '✅ Sí')}
            {t.is_ignored && row('Ignorado en balance', '👁️ Sí')}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
          <button onClick={onDelete} style={{ flex:1, padding:'10px 0', background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:8, color:'var(--red)', cursor:'pointer', fontSize:13, fontWeight:700 }}>
            🗑️ Eliminar
          </button>
          <button onClick={onClose} style={{ flex:1, padding:'10px 0', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [modal, setModal] = useState<'expense'|'income'|'transfer'|null>(null)
  const [filter, setFilter] = useState<'all'|'expense'|'income'|'transfer'>('all')
  const [detail, setDetail] = useState<Transaction | null>(null)
  const { transactions, totalIncome, totalExpenses, savings, refetch } = useTransactions(user?.id, month, year)

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  async function deleteTransaction(id: string) {
    if (!confirm('¿Eliminar este movimiento?')) return
    await supabase.from('transactions').delete().eq('id', id)
    setDetail(null)
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
          <div key={t.id} onClick={() => setDetail(t)}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, cursor:'pointer', transition:'background .15s' }}
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
          </div>
        ))}
      </div>

      <div style={{ position:'sticky', bottom:0, padding:'12px 0', background:'linear-gradient(to top,var(--bg) 60%,transparent)', display:'flex', justifyContent:'flex-end', gap:8, flexWrap:'wrap' }}>
        <button onClick={() => setModal('income')} style={{ padding:'8px 14px', background:'var(--green-bg)', border:'1px solid var(--green)', borderRadius:8, color:'var(--green)', cursor:'pointer', fontSize:12, fontWeight:700 }}>📈 Ingreso</button>
        <button onClick={() => setModal('transfer')} style={{ padding:'8px 14px', background:'var(--blue-bg)', border:'1px solid var(--blue)', borderRadius:8, color:'var(--blue)', cursor:'pointer', fontSize:12, fontWeight:700 }}>🔄 SINPE</button>
        <button onClick={() => setModal('expense')} style={{ padding:'9px 18px', background:'var(--accent)', border:'none', borderRadius:24, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>＋ Nuevo gasto</button>
      </div>

      {modal && <TransactionModal type={modal} onClose={() => setModal(null)} onSaved={refetch} />}
      {detail && <TransactionDetail t={detail} onClose={() => setDetail(null)} onDelete={() => deleteTransaction(detail.id)} />}
    </div>
  )
}
