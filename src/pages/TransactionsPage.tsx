import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import { useAccounts } from '../hooks/useAccounts'
import { useCategories } from '../hooks/useCategories'
import { useCreditCards } from '../hooks/useCreditCards'
import { useExchangeRate } from '../hooks/useExchangeRate'
import TransactionModal from './TransactionModal'
import { supabase } from '../lib/supabase'
import type { Transaction } from '../types/database'

const CRC = (n: number) => '₡' + Math.round(n).toLocaleString('es-CR')
const USD = (n: number) => '$' + n.toFixed(2)

function fmtAmount(amount: number, currency: string) {
  return currency === 'USD' ? USD(amount) : CRC(amount)
}

function TransactionDetail({ t, onClose, onDelete, onSaved, userId }: {
  t: Transaction, onClose: () => void, onDelete: () => void, onSaved: () => void, userId: string
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { accounts } = useAccounts(userId)
  const { expenseCategories, incomeCategories } = useCategories(userId)
  const { cards } = useCreditCards(userId)
  const { toCRC, rate } = useExchangeRate()
  const categories = t.type === 'income' ? incomeCategories : expenseCategories

  const currency = (t as any).currency || 'CRC'
  const hasCreditCard = !!(t as any).credit_card_id
  const [useCreditCard, setUseCreditCard] = useState(hasCreditCard)

  const [form, setForm] = useState({
    amount: String(t.amount),
    date: t.date,
    description: t.description || '',
    account_id: t.account_id || '',
    credit_card_id: (t as any).credit_card_id || '',
    category_id: t.category_id || '',
    notes: t.notes || '',
    location: t.location || '',
    is_recurrent: t.is_recurrent || false,
    is_ignored: t.is_ignored || false,
  })

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }))
  const color = t.type === 'income' ? 'var(--green)' : t.type === 'transfer' ? 'var(--blue)' : 'var(--red)'
  const bgColor = t.type === 'income' ? 'var(--green-bg)' : t.type === 'transfer' ? 'var(--blue-bg)' : 'var(--red-bg)'
  const icon = t.type === 'income' ? '📈' : t.type === 'transfer' ? '🔄' : '📉'
  const typeLabel = t.type === 'income' ? 'Ingreso' : t.type === 'transfer' ? 'Transferencia' : 'Gasto'
  const inp: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'8px 11px', fontSize:13, outline:'none', boxSizing:'border-box' }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const { error } = await supabase.from('transactions').update({
        amount: parseFloat(form.amount),
        date: form.date,
        description: form.description || null,
        account_id: useCreditCard ? null : form.account_id || null,
        credit_card_id: useCreditCard ? form.credit_card_id || null : null,
        category_id: form.category_id || null,
        notes: form.notes || null,
        location: form.location || null,
        is_recurrent: form.is_recurrent,
        is_ignored: form.is_ignored,
      }).eq('id', t.id)
      if (error) throw error
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const row = (label: string, value: string | undefined | null) => value ? (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:12, color:'var(--text3)', fontWeight:600 }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:600, maxWidth:'60%', textAlign:'right' }}>{value}</span>
    </div>
  ) : null

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px 12px 0 0', width:'100%', maxWidth:520, maxHeight:'90vh', display:'flex', flexDirection:'column' }}>

        <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:bgColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
          <div style={{ fontSize:14, fontWeight:700, flex:1 }}>{editing ? 'Editar movimiento' : 'Detalle del movimiento'}</div>
          <div onClick={onClose} style={{ cursor:'pointer', color:'var(--text3)', fontSize:22 }}>×</div>
        </div>

        <div style={{ padding:18, overflowY:'auto', flex:1 }}>
          {editing ? (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Monto</label>
                  <input inputMode="decimal" value={form.amount} onChange={e => set('amount', e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Fecha</label>
                  <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inp} />
                </div>
              </div>

              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Descripción</label>
                <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descripción" style={inp} />
              </div>

              {t.type === 'expense' && cards.length > 0 && (
                <div style={{ display:'flex', gap:4, background:'var(--bg3)', borderRadius:8, padding:3, marginBottom:10 }}>
                  <div onClick={() => setUseCreditCard(false)}
                    style={{ flex:1, padding:'6px 8px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700, background: !useCreditCard?'var(--accent)':'transparent', color: !useCreditCard?'#fff':'var(--text2)', textAlign:'center' }}>
                    🏦 Cuenta
                  </div>
                  <div onClick={() => setUseCreditCard(true)}
                    style={{ flex:1, padding:'6px 8px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700, background: useCreditCard?'var(--accent)':'transparent', color: useCreditCard?'#fff':'var(--text2)', textAlign:'center' }}>
                    💳 Tarjeta
                  </div>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                  {useCreditCard && t.type === 'expense' ? (
                    <>
                      <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Tarjeta</label>
                      <select value={form.credit_card_id} onChange={e => set('credit_card_id', e.target.value)} style={{ ...inp, appearance:'none' }}>
                        <option value="">Seleccionar...</option>
                        {cards.map(c => <option key={c.id} value={c.id}>{c.name} •••{c.last_four}</option>)}
                      </select>
                    </>
                  ) : (
                    <>
                      <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Cuenta</label>
                      <select value={form.account_id} onChange={e => set('account_id', e.target.value)} style={{ ...inp, appearance:'none' }}>
                        <option value="">Sin cuenta</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </>
                  )}
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Categoría</label>
                  <select value={form.category_id} onChange={e => set('category_id', e.target.value)} style={{ ...inp, appearance:'none' }}>
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Lugar</label>
                <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Lugar" style={inp} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Observación</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notas" style={{ ...inp, minHeight:60, resize:'vertical' }} />
              </div>
              {[
                { label:'Recurrente', key:'is_recurrent' },
                { label:'Ignorar en balance', key:'is_ignored' },
              ].map(opt => (
                <div key={opt.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0' }}>
                  <span style={{ fontSize:12, fontWeight:600 }}>{opt.label}</span>
                  <div onClick={() => set(opt.key, !(form as any)[opt.key])}
                    style={{ width:32, height:18, background:(form as any)[opt.key]?'var(--accent)':'var(--bg4)', borderRadius:9, position:'relative', cursor:'pointer', transition:'background .2s' }}>
                    <div style={{ position:'absolute', width:13, height:13, background:'#fff', borderRadius:'50%', top:2.5, left:(form as any)[opt.key]?15:2.5, transition:'left .2s' }} />
                  </div>
                </div>
              ))}
              {error && <div style={{ marginTop:10, padding:'8px 12px', background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:8, fontSize:12, color:'var(--red)' }}>{error}</div>}
            </div>
          ) : (
            <div>
              <div style={{ textAlign:'center', padding:'20px 0 24px', borderBottom:'1px solid var(--border)', marginBottom:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:6 }}>{typeLabel}</div>
                <div style={{ fontSize:32, fontWeight:800, color }}>
                  {t.type === 'income' ? '+' : '-'}{fmtAmount(t.amount, currency)}
                </div>
                {currency === 'USD' && rate && (
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>
                    ≈ {CRC(toCRC(t.amount, currency))} · TC: ₡{rate.venta} ({rate.fuente})
                  </div>
                )}
                <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>{t.date}</div>
              </div>
              <div style={{ marginTop:8 }}>
                {row('Descripción', t.description)}
                {row('Cuenta', t.account?.name)}
                {row('Categoría', t.category?.name)}
                {row('Moneda', currency)}
                {row('Lugar', t.location)}
                {row('Observación', t.notes)}
                {row('Etiquetas', t.labels?.length ? t.labels.join(', ') : null)}
                {row('Recordatorio', t.remind_at)}
                {t.is_recurrent && row('Recurrente', '✅ Sí')}
                {t.is_ignored && row('Ignorado en balance', '👁️ Sí')}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} style={{ flex:1, padding:'10px 0', background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', cursor:'pointer', fontSize:13, fontWeight:600 }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ flex:1, padding:'10px 0', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, opacity:saving?0.7:1 }}>
                {saving ? 'Guardando...' : '💾 Guardar'}
              </button>
            </>
          ) : (
            <>
              <button onClick={onDelete} style={{ padding:'10px 14px', background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:8, color:'var(--red)', cursor:'pointer', fontSize:13, fontWeight:700 }}>🗑️</button>
              <button onClick={() => setEditing(true)} style={{ flex:1, padding:'10px 0', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', cursor:'pointer', fontSize:13, fontWeight:700 }}>✏️ Editar</button>
              <button onClick={onClose} style={{ flex:1, padding:'10px 0', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>Cerrar</button>
            </>
          )}
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
  const { toCRC } = useExchangeRate()

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
        ) : filtered.map(t => {
          const cur = (t as any).currency || 'CRC'
          return (
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
                  {t.type==='income'?'+':'-'}{fmtAmount(t.amount, cur)}
                </div>
                {cur === 'USD' && (
                  <div style={{ fontSize:9, color:'var(--text3)' }}>
                    ≈ {CRC(toCRC(t.amount, cur))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ position:'sticky', bottom:0, padding:'12px 0', background:'linear-gradient(to top,var(--bg) 60%,transparent)', display:'flex', justifyContent:'flex-end', gap:8, flexWrap:'wrap' }}>
        <button onClick={() => setModal('income')} style={{ padding:'8px 14px', background:'var(--green-bg)', border:'1px solid var(--green)', borderRadius:8, color:'var(--green)', cursor:'pointer', fontSize:12, fontWeight:700 }}>📈 Ingreso</button>
        <button onClick={() => setModal('transfer')} style={{ padding:'8px 14px', background:'var(--blue-bg)', border:'1px solid var(--blue)', borderRadius:8, color:'var(--blue)', cursor:'pointer', fontSize:12, fontWeight:700 }}>🔄 SINPE</button>
        <button onClick={() => setModal('expense')} style={{ padding:'9px 18px', background:'var(--accent)', border:'none', borderRadius:24, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>＋ Nuevo gasto</button>
      </div>

      {modal && <TransactionModal type={modal} onClose={() => setModal(null)} onSaved={refetch} />}
      {detail && (
        <TransactionDetail
          t={detail}
          userId={user!.id}
          onClose={() => setDetail(null)}
          onDelete={() => deleteTransaction(detail.id)}
          onSaved={refetch}
        />
      )}
    </div>
  )
}
