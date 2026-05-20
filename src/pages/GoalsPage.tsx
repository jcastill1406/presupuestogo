import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useGoals } from '../hooks/useGoals'

const CRC = (n: number) => '₡' + Math.round(n).toLocaleString('es-CR')

export default function GoalsPage() {
  const { user } = useAuth()
  const { goals, createGoal, addContribution, deleteGoal } = useGoals(user?.id)
  const [showForm, setShowForm] = useState(false)
  const [contributing, setContributing] = useState<string | null>(null)
  const [contribAmount, setContribAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name:'', icon:'🎯', color:'#6c63ff', target_amount:'', deadline:'', notes:'' })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const inp: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'8px 11px', fontSize:13, outline:'none' }

  async function handleCreate() {
    if (!form.name || !form.target_amount) return
    setLoading(true)
    await createGoal({
      name: form.name, icon: form.icon, color: form.color,
      target_amount: parseFloat(form.target_amount),
      current_amount: 0, status: 'active',
      deadline: form.deadline || null,
      notes: form.notes || null,
    })
    setForm({ name:'', icon:'🎯', color:'#6c63ff', target_amount:'', deadline:'', notes:'' })
    setShowForm(false)
    setLoading(false)
  }

  async function handleContrib(goalId: string) {
    if (!contribAmount) return
    await addContribution(goalId, parseFloat(contribAmount))
    setContributing(null)
    setContribAmount('')
  }

  const icons = ['🎯','🏠','🚗','✈️','📱','💍','🎓','🏋️','🐶','💰','🏖️','🎸']

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontSize:13, color:'var(--text2)' }}>{goals.length} objetivo{goals.length !== 1 ? 's' : ''} activo{goals.length !== 1 ? 's' : ''}</div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding:'9px 16px', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>
          {showForm ? '✕ Cancelar' : '＋ Nueva meta'}
        </button>
      </div>

      {showForm && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--accent)', borderRadius:12, padding:16, marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Nuevo objetivo</div>
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Ícono</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {icons.map(ic => (
                <div key={ic} onClick={() => set('icon', ic)}
                  style={{ width:36, height:36, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, cursor:'pointer', background: form.icon===ic ? 'var(--accent-dim)' : 'var(--bg3)', border: form.icon===ic ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                  {ic}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Nombre *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Casa propia, vacaciones..." style={inp} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Meta (₡) *</label>
              <input type="number" value={form.target_amount} onChange={e => set('target_amount', e.target.value)} placeholder="0" style={inp} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Fecha límite</label>
              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Color</label>
              <input type="color" value={form.color} onChange={e => set('color', e.target.value)} style={{ ...inp, padding:4, height:38, cursor:'pointer' }} />
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Notas</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Descripción opcional..." style={inp} />
          </div>
          <button onClick={handleCreate} disabled={loading} style={{ width:'100%', padding:10, background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, opacity:loading?.7:1 }}>
            {loading ? 'Guardando...' : '💾 Crear objetivo'}
          </button>
        </div>
      )}

      {goals.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text3)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🎯</div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text2)', marginBottom:6 }}>Sin objetivos aún</div>
          <div style={{ fontSize:12 }}>Crea tu primera meta de ahorro</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {goals.map(g => {
            const pct = Math.round(g.current_amount / g.target_amount * 100)
            const remaining = g.target_amount - g.current_amount
            return (
              <div key={g.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:`${g.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{g.icon}</div>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background: g.status==='completed'?'var(--green-bg)':pct>=80?'var(--amber-bg)':'var(--blue-bg)', color: g.status==='completed'?'var(--green)':pct>=80?'var(--amber)':'var(--blue)' }}>
                    {g.status==='completed'?'✓ Logrado':`${pct}%`}
                  </span>
                </div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>{g.name}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginBottom:8 }}>Meta: {CRC(g.target_amount)}{g.deadline ? ` • ${g.deadline}` : ''}</div>
                <div style={{ fontSize:18, fontWeight:800, color:g.color, marginBottom:6 }}>{CRC(g.current_amount)}</div>
                <div style={{ height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden', marginBottom:4 }}>
                  <div style={{ height:'100%', borderRadius:3, background:g.color, width:`${Math.min(100,pct)}%`, transition:'width .5s' }} />
                </div>
                <div style={{ fontSize:10, color:'var(--text3)', marginBottom:10 }}>
                  {remaining > 0 ? `Faltan: ${CRC(remaining)}` : '¡Meta alcanzada! 🎉'}
                </div>
                {contributing === g.id ? (
                  <div style={{ display:'flex', gap:4 }}>
                    <input type="number" value={contribAmount} onChange={e => setContribAmount(e.target.value)}
                      placeholder="Monto (₡)" style={{ flex:1, background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', padding:'6px 8px', fontSize:12, outline:'none' }} autoFocus />
                    <button onClick={() => handleContrib(g.id)} style={{ padding:'6px 10px', background:'var(--accent)', border:'none', borderRadius:6, color:'#fff', cursor:'pointer', fontSize:12 }}>✓</button>
                    <button onClick={() => setContributing(null)} style={{ padding:'6px 8px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text2)', cursor:'pointer', fontSize:12 }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => setContributing(g.id)} style={{ flex:1, padding:'6px', background:'var(--accent-dim)', border:'1px solid var(--accent)', borderRadius:6, color:'var(--accent2)', cursor:'pointer', fontSize:11, fontWeight:700 }}>＋ Aportar</button>
                    <button onClick={() => deleteGoal(g.id)} style={{ padding:'6px 8px', background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:6, color:'var(--red)', cursor:'pointer', fontSize:11 }}>🗑️</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
