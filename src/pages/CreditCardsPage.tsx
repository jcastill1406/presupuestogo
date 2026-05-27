import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCreditCards, CreditCard } from '../hooks/useCreditCards'

const CRC = (n: number) => '₡' + Math.round(n).toLocaleString('es-CR')
const USD = (n: number) => '$' + n.toFixed(2)
const fmt = (n: number, currency: string) => currency === 'USD' ? USD(n) : CRC(n)

const BANKS = ['BAC', 'Davivienda', 'Promerica', 'Scotiabank', 'BCR', 'Nacional', 'Otro']
const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899']

function CardForm({ userId, initial, onSaved, onClose }: { userId: string, initial?: CreditCard, onSaved: () => void, onClose: () => void }) {
  const { createCard, updateCard } = useCreditCards(userId)
  const [form, setForm] = useState({
    name: initial?.name || '',
    last_four: initial?.last_four || '',
    bank: initial?.bank || 'BAC',
    cut_day: initial?.cut_day || 15,
    payment_day: initial?.payment_day || 20,
    credit_limit: initial?.credit_limit || 0,
    currency: initial?.currency || 'CRC',
    color: initial?.color || '#3b82f6',
  })
  const [limitStr, setLimitStr] = useState(String(initial?.credit_limit || 0))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))
  const inp: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'8px 11px', fontSize:13, outline:'none', boxSizing:'border-box' }

  async function handleSave() {
    if (!form.name || !form.last_four) { setError('Nombre y últimos 4 dígitos son obligatorios'); return }
    setSaving(true)
    try {
      const data = { ...form, credit_limit: parseFloat(limitStr) || 0 }
      if (initial?.id) {
        await updateCard(initial.id, data)
      } else {
        await createCard(data)
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px 12px 0 0', width:'100%', maxWidth:520, maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:`${form.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>💳</div>
          <div style={{ fontSize:14, fontWeight:700, flex:1 }}>{initial ? 'Editar tarjeta' : 'Nueva tarjeta'}</div>
          <div onClick={onClose} style={{ cursor:'pointer', color:'var(--text3)', fontSize:22 }}>×</div>
        </div>

        <div style={{ padding:18, overflowY:'auto', flex:1 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Nombre</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: BAC Visa" style={inp} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Últimos 4 dígitos</label>
              <input value={form.last_four} onChange={e => set('last_four', e.target.value.slice(0,4))} placeholder="4046" maxLength={4} style={inp} />
            </div>
          </div>

          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Banco</label>
            <select value={form.bank} onChange={e => set('bank', e.target.value)} style={{ ...inp, appearance:'none' }}>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Día de corte</label>
              <input inputMode="numeric" value={String(form.cut_day)} onChange={e => set('cut_day', parseInt(e.target.value) || 1)} style={inp} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Día de pago</label>
              <input inputMode="numeric" value={String(form.payment_day)} onChange={e => set('payment_day', parseInt(e.target.value) || 1)} style={inp} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Límite de crédito</label>
              <input
                inputMode="decimal"
                value={limitStr}
                onChange={e => setLimitStr(e.target.value)}
                placeholder="0"
                style={inp}
              />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Moneda</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)} style={{ ...inp, appearance:'none' }}>
                <option value="CRC">Colones (₡)</option>
                <option value="USD">Dólares ($)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:6 }}>Color</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => set('color', c)}
                  style={{ width:32, height:32, borderRadius:'50%', background:c, border:`3px solid ${form.color===c?'#fff':'transparent'}`, cursor:'pointer', boxShadow: form.color===c?`0 0 0 2px ${c}`:'none' }} />
              ))}
            </div>
          </div>

          <div style={{ background:`linear-gradient(135deg, ${form.color}, ${form.color}99)`, borderRadius:12, padding:20, color:'#fff' }}>
            <div style={{ fontSize:11, opacity:0.8, marginBottom:4 }}>{form.bank}</div>
            <div style={{ fontSize:18, fontWeight:800, letterSpacing:2 }}>•••• •••• •••• {form.last_four || '????'}</div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, fontSize:11, opacity:0.8 }}>
              <span>Corte: día {form.cut_day}</span>
              <span>Pago: día {form.payment_day}</span>
            </div>
          </div>

          {error && <div style={{ marginTop:10, padding:'8px 12px', background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:8, fontSize:12, color:'var(--red)' }}>{error}</div>}
        </div>

        <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px 0', background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', cursor:'pointer', fontSize:13, fontWeight:600 }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{ flex:1, padding:'10px 0', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, opacity:saving?0.7:1 }}>
            {saving ? 'Guardando...' : '💾 Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CardDetail({ card, userId, onClose, onEdit, onDelete, onRefresh }: {
  card: CreditCard, userId: string, onClose: () => void, onEdit: () => void, onDelete: () => void, onRefresh: () => void
}) {
  const { getCurrentPeriod, getNextPaymentDate, getCardTransactions, registerPayment, getCardPayments } = useCreditCards(userId)
  const [transactions, setTransactions] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [tab, setTab] = useState<'gastos'|'pagos'>('gastos')
  const [paymentModal, setPaymentModal] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payNotes, setPayNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const period = getCurrentPeriod(card)
  const nextPayment = getNextPaymentDate(card)
  const modalInp: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'8px 11px', fontSize:13, outline:'none', boxSizing:'border-box' }

  useEffect(() => {
    getCardTransactions(card.id, period.start, period.end).then(setTransactions)
    getCardPayments(card.id).then(setPayments)
  }, [card.id])

  const totalGastos = transactions.reduce((s, t) => s + t.amount, 0)
  const disponible = card.credit_limit - totalGastos
  const porcentajeUsado = card.credit_limit > 0 ? (totalGastos / card.credit_limit) * 100 : 0

  async function handlePayment() {
    if (!payAmount) return
    setSaving(true)
    try {
      await registerPayment(card.id, parseFloat(payAmount), payDate, period.start, period.end, payNotes)
      setPaymentModal(false)
      setPayAmount('')
      setPayNotes('')
      getCardPayments(card.id).then(setPayments)
      onRefresh()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px 12px 0 0', width:'100%', maxWidth:520, maxHeight:'92vh', display:'flex', flexDirection:'column' }}>

        <div style={{ background:`linear-gradient(135deg, ${card.color}, ${card.color}99)`, padding:20, borderRadius:'12px 12px 0 0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginBottom:2 }}>{card.bank}</div>
              <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{card.name}</div>
            </div>
            <div onClick={onClose} style={{ cursor:'pointer', color:'rgba(255,255,255,0.7)', fontSize:22 }}>×</div>
          </div>
          <div style={{ fontSize:16, fontWeight:700, color:'#fff', letterSpacing:2, marginBottom:16 }}>•••• •••• •••• {card.last_four}</div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', marginBottom:2 }}>GASTADO</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{fmt(totalGastos, card.currency)}</div>
            </div>
            <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', marginBottom:2 }}>DISPONIBLE</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{fmt(disponible, card.currency)}</div>
            </div>
            <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', marginBottom:2 }}>PRÓXIMO PAGO</div>
              <div style={{ fontSize:11, fontWeight:700, color:'#fff' }}>{nextPayment}</div>
            </div>
          </div>

          {card.credit_limit > 0 && (
            <div style={{ marginTop:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(255,255,255,0.7)', marginBottom:4 }}>
                <span>Uso del crédito</span>
                <span>{porcentajeUsado.toFixed(0)}%</span>
              </div>
              <div style={{ height:4, background:'rgba(0,0,0,0.3)', borderRadius:2 }}>
                <div style={{ height:'100%', width:`${Math.min(porcentajeUsado, 100)}%`, background: porcentajeUsado > 80 ? '#ef4444' : '#fff', borderRadius:2, transition:'width .3s' }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:'10px 16px', background:'var(--bg3)', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)' }}>
          <span>📅 Período: {period.start} al {period.end}</span>
          <span>✂️ Corte: día {card.cut_day}</span>
        </div>

        <div style={{ display:'flex', gap:4, padding:'8px 16px', borderBottom:'1px solid var(--border)' }}>
          {(['gastos','pagos'] as const).map(t => (
            <div key={t} onClick={() => setTab(t)}
              style={{ padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, background: tab===t?'var(--accent)':'var(--bg3)', color: tab===t?'#fff':'var(--text2)' }}>
              {t === 'gastos' ? `💸 Gastos (${transactions.length})` : `💳 Pagos (${payments.length})`}
            </div>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:16 }}>
          {tab === 'gastos' ? (
            transactions.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text3)' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>📭</div>
                <div style={{ fontSize:12 }}>Sin gastos en este período</div>
              </div>
            ) : transactions.map(t => (
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600 }}>{t.description || 'Sin descripción'}</div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>{t.date}</div>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--red)' }}>-{fmt(t.amount, card.currency)}</div>
              </div>
            ))
          ) : (
            payments.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text3)' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>💳</div>
                <div style={{ fontSize:12 }}>Sin pagos registrados</div>
              </div>
            ) : payments.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600 }}>Pago {fmt(p.amount, card.currency)}</div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>{p.payment_date} • {p.period_start} al {p.period_end}</div>
                  {p.notes && <div style={{ fontSize:10, color:'var(--text3)' }}>{p.notes}</div>}
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--green)' }}>+{fmt(p.amount, card.currency)}</div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
          <button onClick={onDelete} style={{ padding:'10px 12px', background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:8, color:'var(--red)', cursor:'pointer', fontSize:13 }}>🗑️</button>
          <button onClick={onEdit} style={{ flex:1, padding:'10px 0', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', cursor:'pointer', fontSize:13, fontWeight:600 }}>✏️ Editar</button>
          <button onClick={() => setPaymentModal(true)} style={{ flex:1, padding:'10px 0', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>💳 Registrar pago</button>
        </div>
      </div>

      {paymentModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, padding:20 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:20, width:'100%', maxWidth:360 }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>💳 Registrar pago</div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Monto pagado</label>
              <input inputMode="decimal" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0" style={modalInp} />
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Fecha de pago</label>
              <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} style={modalInp} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Notas</label>
              <input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="Opcional" style={modalInp} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setPaymentModal(false)} style={{ flex:1, padding:'10px 0', background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', cursor:'pointer', fontSize:13 }}>Cancelar</button>
              <button onClick={handlePayment} disabled={saving} style={{ flex:1, padding:'10px 0', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, opacity:saving?0.7:1 }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CreditCardsPage() {
  const { user } = useAuth()
  const { cards, loading, deleteCard, getCurrentPeriod, getCardTransactions, refetch } = useCreditCards(user?.id)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<CreditCard | null>(null)
  const [detail, setDetail] = useState<CreditCard | null>(null)
  const [cardTotals, setCardTotals] = useState<Record<string, number>>({})

  useEffect(() => {
    cards.forEach(async card => {
      const period = getCurrentPeriod(card)
      const txs = await getCardTransactions(card.id, period.start, period.end)
      const total = txs.reduce((s: number, t: any) => s + t.amount, 0)
      setCardTotals(prev => ({ ...prev, [card.id]: total }))
    })
  }, [cards])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta tarjeta?')) return
    await deleteCard(id)
    setDetail(null)
    refetch()
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:16, fontWeight:700 }}>Tarjetas de crédito</div>
        <button onClick={() => { setEditing(null); setModal(true) }}
          style={{ padding:'8px 14px', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
          + Nueva
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text3)' }}>Cargando...</div>
      ) : cards.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text3)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>💳</div>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>Sin tarjetas</div>
          <div style={{ fontSize:12 }}>Agrega tu primera tarjeta de crédito</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {cards.map(card => {
            const period = getCurrentPeriod(card)
            const total = cardTotals[card.id] || 0
            const pct = card.credit_limit > 0 ? (total / card.credit_limit) * 100 : 0

            return (
              <div key={card.id} onClick={() => setDetail(card)}
                style={{ background:`linear-gradient(135deg, ${card.color}, ${card.color}99)`, borderRadius:16, padding:20, cursor:'pointer' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)' }}>{card.bank}</div>
                    <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{card.name}</div>
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', textAlign:'right' }}>
                    <div>Corte: día {card.cut_day}</div>
                    <div>Pago: día {card.payment_day}</div>
                  </div>
                </div>

                <div style={{ fontSize:14, fontWeight:700, color:'#fff', letterSpacing:2, marginBottom:14 }}>
                  •••• •••• •••• {card.last_four}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                  <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.7)', marginBottom:2 }}>GASTADO ESTE PERÍODO</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{fmt(total, card.currency)}</div>
                  </div>
                  <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.7)', marginBottom:2 }}>DISPONIBLE</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{fmt(card.credit_limit - total, card.currency)}</div>
                  </div>
                </div>

                {card.credit_limit > 0 && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(255,255,255,0.7)', marginBottom:4 }}>
                      <span>Período: {period.start} al {period.end}</span>
                      <span>{pct.toFixed(0)}% usado</span>
                    </div>
                    <div style={{ height:4, background:'rgba(0,0,0,0.3)', borderRadius:2 }}>
                      <div style={{ height:'100%', width:`${Math.min(pct, 100)}%`, background: pct > 80 ? '#ef4444' : '#fff', borderRadius:2 }} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <CardForm
          userId={user!.id}
          initial={editing || undefined}
          onSaved={refetch}
          onClose={() => { setModal(false); setEditing(null) }}
        />
      )}

      {detail && (
        <CardDetail
          card={detail}
          userId={user!.id}
          onClose={() => setDetail(null)}
          onEdit={() => { setEditing(detail); setDetail(null); setModal(true) }}
          onDelete={() => handleDelete(detail.id)}
          onRefresh={refetch}
        />
      )}
    </div>
  )
}
