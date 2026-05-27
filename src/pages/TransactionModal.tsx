import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useAccounts } from '../hooks/useAccounts'
import { useCategories } from '../hooks/useCategories'
import { useCreditCards } from '../hooks/useCreditCards'

interface Props {
  type: 'expense' | 'income' | 'transfer'
  onClose: () => void
  onSaved: () => void
}

export default function TransactionModal({ type, onClose, onSaved }: Props) {
  const { user } = useAuth()
  const { accounts } = useAccounts(user?.id)
  const { expenseCategories, incomeCategories } = useCategories(user?.id)
  const { cards } = useCreditCards(user?.id)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useCreditCard, setUseCreditCard] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    category_id: '',
    account_id: '',
    credit_card_id: '',
    transfer_account_id: '',
    notes: '',
    is_recurrent: false,
    is_ignored: false,
    location: '',
    labels: [] as string[],
    remind_at: '',
  })

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }))
  const categories = type === 'income' ? incomeCategories : expenseCategories
  const colors = { expense:'var(--red)', income:'var(--green)', transfer:'var(--blue)' }
  const icons = { expense:'📉', income:'📈', transfer:'🔄' }
  const titles = { expense:'Registrar Gasto', income:'Registrar Ingreso', transfer:'Registrar Transferencia' }
  const inp: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'8px 11px', fontSize:13, outline:'none', boxSizing:'border-box' }

  async function handleSave() {
    if (!form.amount) { setError('El monto es obligatorio'); return }
    if (!useCreditCard && !form.account_id) { setError('Selecciona una cuenta o tarjeta'); return }
    if (useCreditCard && !form.credit_card_id) { setError('Selecciona una tarjeta'); return }
    if (type === 'transfer' && !form.transfer_account_id) { setError('Selecciona la cuenta destino'); return }
    setLoading(true)
    setError('')
    try {
      const payload: any = {
        user_id: user!.id,
        type,
        amount: parseFloat(form.amount),
        date: form.date,
        description: form.description || null,
        account_id: useCreditCard ? null : form.account_id,
        credit_card_id: useCreditCard ? form.credit_card_id : null,
        category_id: form.category_id || null,
        notes: form.notes || null,
        is_recurrent: form.is_recurrent,
        is_ignored: form.is_ignored,
        location: form.location || null,
        labels: form.labels,
        remind_at: form.remind_at || null,
        transfer_account_id: type === 'transfer' ? form.transfer_account_id : null,
      }
      const { error } = await supabase.from('transactions').insert(payload)
      if (error) throw error
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}
      onClick={e => { if(e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px 12px 0 0', width:'100%', maxWidth:520, maxHeight:'92vh', display:'flex', flexDirection:'column' }}>
        
        <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:`${colors[type]}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icons[type]}</div>
          <div style={{ fontSize:14, fontWeight:700, flex:1 }}>{titles[type]}</div>
          <div onClick={onClose} style={{ cursor:'pointer', color:'var(--text3)', fontSize:20 }}>×</div>
        </div>

        <div style={{ padding:18, overflowY:'auto', flex:1 }}>
          
          {/* Monto y Fecha */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Monto (₡) *</label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" style={inp} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Fecha *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inp} />
            </div>
          </div>

          {/* Descripción */}
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Descripción</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} placeholder={type==='expense'?'¿En qué gastaste?':type==='income'?'¿De dónde proviene?':'Motivo de la transferencia'} style={inp} />
          </div>

          {/* Toggle cuenta vs tarjeta - solo para gastos */}
          {type === 'expense' && cards.length > 0 && (
            <div style={{ marginBottom:10 }}>
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
            </div>
          )}

          {/* Cuenta o Tarjeta + Categoría */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              {useCreditCard && type === 'expense' ? (
                <>
                  <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Tarjeta *</label>
                  <select value={form.credit_card_id} onChange={e => set('credit_card_id', e.target.value)} style={{ ...inp, appearance:'none' }}>
                    <option value="">Seleccionar...</option>
                    {cards.map(c => <option key={c.id} value={c.id}>{c.name} •••{c.last_four}</option>)}
                  </select>
                </>
              ) : (
                <>
                  <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>{type==='transfer'?'Cuenta origen *':'Cuenta *'}</label>
                  <select value={form.account_id} onChange={e => set('account_id', e.target.value)} style={{ ...inp, appearance:'none' }}>
                    <option value="">Seleccionar...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </>
              )}
            </div>

            {type === 'transfer' ? (
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Cuenta destino *</label>
                <select value={form.transfer_account_id} onChange={e => set('transfer_account_id', e.target.value)} style={{ ...inp, appearance:'none' }}>
                  <option value="">Seleccionar...</option>
                  {accounts.filter(a => a.id !== form.account_id).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Categoría</label>
                <select value={form.category_id} onChange={e => set('category_id', e.target.value)} style={{ ...inp, appearance:'none' }}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Lugar */}
          {type !== 'transfer' && (
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Lugar</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Supermercado, restaurante..." style={inp} />
            </div>
          )}

          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Recordarme</label>
            <input type="date" value={form.remind_at} onChange={e => set('remind_at', e.target.value)} style={inp} />
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Etiquetas</label>
            <input value={form.labels.join(',')} onChange={e => set('labels', e.target.value.split(',').filter(Boolean))} placeholder="trabajo, familia..." style={inp} />
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Observación</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notas adicionales..." style={{ ...inp, minHeight:60, resize:'vertical' }} />
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { label: type==='expense'?'Gasto recurrente':type==='income'?'Ingreso recurrente':'Transferencia recurrente', key:'is_recurrent' },
              { label:'Ignorar en balance', key:'is_ignored' },
            ].map(opt => (
              <div key={opt.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0' }}>
                <span style={{ fontSize:12, fontWeight:600 }}>{opt.label}</span>
                <div onClick={() => set(opt.key, !(form as any)[opt.key])}
                  style={{ width:32, height:18, background:(form as any)[opt.key]?'var(--accent)':'var(--bg4)', borderRadius:9, position:'relative', cursor:'pointer', transition:'background .2s', flexShrink:0 }}>
                  <div style={{ position:'absolute', width:13, height:13, background:'#fff', borderRadius:'50%', top:2.5, left:(form as any)[opt.key]?15:2.5, transition:'left .2s' }} />
                </div>
              </div>
            ))}
          </div>

          {error && <div style={{ marginTop:10, padding:'8px 12px', background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:8, fontSize:12, color:'var(--red)' }}>{error}</div>}
        </div>

        <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 16px', background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', cursor:'pointer', fontSize:13, fontWeight:600 }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading} style={{ padding:'8px 16px', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, opacity: loading ? .7 : 1 }}>
            {loading ? 'Guardando...' : '💾 Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
