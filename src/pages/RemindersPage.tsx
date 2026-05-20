import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useReminders } from '../hooks/useReminders'
import { useAccounts } from '../hooks/useAccounts'

const CRC = (n: number) => '₡' + Math.round(n).toLocaleString('es-CR')

export default function RemindersPage() {
  const { user } = useAuth()
  const { reminders, markDone, createReminder, deleteReminder } = useReminders(user?.id)
  const { accounts } = useAccounts(user?.id)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title:'', description:'', amount:'', due_date:'', type:'payment', notify_days_before:'3', account_id:'', is_recurrent:false })
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))
  const inp: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'8px 11px', fontSize:13, outline:'none' }

  async function handleCreate() {
    if (!form.title || !form.due_date) return
    setLoading(true)
    await createReminder({
      title: form.title,
      description: form.description || null,
      amount: form.amount ? parseFloat(form.amount) : null,
      due_date: form.due_date,
      type: form.type as any,
      notify_days_before: parseInt(form.notify_days_before),
      account_id: form.account_id || null,
      is_recurrent: form.is_recurrent,
      is_done: false,
    })
    setForm({ title:'', description:'', amount:'', due_date:'', type:'payment', notify_days_before:'3', account_id:'', is_recurrent:false })
    setShowForm(false)
    setLoading(false)
  }

  const pending = reminders.filter(r => !r.is_done)
  const done = reminders.filter(r => r.is_done)
  const today = new Date().toISOString().split('T')[0]

  const typeIcon = (t: string) => t==='payment'?'💳':t==='service'?'🏠':t==='review'?'📊':'🔔'
  const typeColor = (t: string) => t==='payment'?'var(--red)':t==='service'?'var(--blue)':t==='review'?'var(--amber)':'var(--purple)'
  const typeBg = (t: string) => t==='payment'?'var(--red-bg)':t==='service'?'var(--blue-bg)':t==='review'?'var(--amber-bg)':'#1a0f2a'

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontSize:13, color:'var(--text2)' }}>{pending.length} pendiente{pending.length!==1?'s':''}</div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding:'9px 16px', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>
          {showForm ? '✕ Cancelar' : '＋ Nuevo'}
        </button>
      </div>

      {showForm && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--accent)', borderRadius:12, padding:16, marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Nuevo recordatorio</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Título *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Pago tarjeta, servicio..." style={inp} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Tipo</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...inp, appearance:'none' }}>
                <option value="payment">💳 Pago tarjeta</option>
                <option value="service">🏠 Servicio</option>
                <option value="review">📊 Revisión</option>
                <option value="custom">🔔 Otro</option>
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Fecha vencimiento *</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Monto (₡)</label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" style={inp} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Cuenta asociada</label>
              <select value={form.account_id} onChange={e => set('account_id', e.target.value)} style={{ ...inp, appearance:'none' }}>
                <option value="">Ninguna</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Avisar (días antes)</label>
              <select value={form.notify_days_before} onChange={e => set('notify_days_before', e.target.value)} style={{ ...inp, appearance:'none' }}>
                <option value="1">1 día</option>
                <option value="3">3 días</option>
                <option value="5">5 días</option>
                <option value="7">1 semana</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Descripción</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Notas adicionales..." style={inp} />
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <span style={{ fontSize:12, fontWeight:600 }}>Recordatorio recurrente</span>
            <div onClick={() => set('is_recurrent', !form.is_recurrent)}
              style={{ width:32, height:18, background:form.is_recurrent?'var(--accent)':'var(--bg4)', borderRadius:9, position:'relative', cursor:'pointer', transition:'background .2s' }}>
              <div style={{ position:'absolute', width:13, height:13, background:'#fff', borderRadius:'50%', top:2.5, left:form.is_recurrent?15:2.5, transition:'left .2s' }} />
            </div>
          </div>
          <button onClick={handleCreate} disabled={loading} style={{ width:'100%', padding:10, background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, opacity:loading?.7:1 }}>
            {loading ? 'Guardando...' : '💾 Crear recordatorio'}
          </button>
        </div>
      )}

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14, marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>🔔 Pendientes ({pending.length})</div>
        {pending.length === 0 ? (
          <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text3)', fontSize:12 }}>Sin recordatorios pendientes ✓</div>
        ) : pending.map(r => {
          const isOverdue = r.due_date < today
          return (
            <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', background: isOverdue?'var(--red-bg)':'var(--bg3)', borderRadius:8, marginBottom:6, border: isOverdue?'1px solid var(--red-dim)':'1px solid transparent' }}>
              <div style={{ width:34, height:34, borderRadius:8, background:typeBg(r.type), display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{typeIcon(r.type)}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700 }}>{r.title}</div>
                <div style={{ fontSize:10, color: isOverdue?'var(--red)':'var(--text3)' }}>
                  {isOverdue ? '⚠️ Vencido — ' : ''}{r.due_date}{r.description ? ` • ${r.description}` : ''}
                </div>
              </div>
              {r.amount ? <div style={{ fontSize:12, fontWeight:700, color:typeColor(r.type) }}>{CRC(r.amount)}</div> : null}
              <div style={{ display:'flex', gap:4 }}>
                <button onClick={() => markDone(r.id)} style={{ width:28, height:28, borderRadius:6, background:'var(--green-bg)', border:'1px solid var(--green)', color:'var(--green)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✓</button>
                <button onClick={() => deleteReminder(r.id)} style={{ width:28, height:28, borderRadius:6, background:'var(--red-bg)', border:'1px solid var(--red)', color:'var(--red)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>🗑️</button>
              </div>
            </div>
          )
        })}
      </div>

      {done.length > 0 && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>✅ Completados ({done.length})</div>
          {done.map(r => (
            <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, marginBottom:4, opacity:.5 }}>
              <span style={{ fontSize:16 }}>{typeIcon(r.type)}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, textDecoration:'line-through' }}>{r.title}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{r.due_date}</div>
              </div>
              {r.amount ? <div style={{ fontSize:11, color:'var(--text3)' }}>{CRC(r.amount)}</div> : null}
              <button onClick={() => deleteReminder(r.id)} style={{ width:24, height:24, borderRadius:6, background:'transparent', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:12 }}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
