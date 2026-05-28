import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useBudget } from '../hooks/useBudget'
import { useCategories } from '../hooks/useCategories'

const CRC = (n: number) => '₡' + Math.round(n).toLocaleString('es-CR')

function CategoryIcon({ icon }: { icon: string }) {
  const isEmoji = icon && /\p{Emoji}/u.test(icon)
  return <span style={{ fontSize:14 }}>{isEmoji ? icon : '📂'}</span>
}

export default function BudgetPage() {
  const { user } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const { budgets, totalBudgeted, totalSpent, upsertBudget } = useBudget(user?.id, month, year)
  const { expenseCategories } = useCategories(user?.id)
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const inp: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'8px 11px', fontSize:13, outline:'none' }

  async function handleSave(categoryId: string) {
    if (!editVal) return
    await upsertBudget(categoryId, parseFloat(editVal))
    setEditing(null)
    setEditVal('')
  }

  const available = totalBudgeted - totalSpent
  const overallPct = totalBudgeted > 0 ? Math.round(totalSpent / totalBudgeted * 100) : 0

  return (
    <div>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:14, flexWrap:'wrap' }}>
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
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:4 }}>🎯 Presupuestado</div>
          <div style={{ fontSize:16, fontWeight:700 }}>{CRC(totalBudgeted)}</div>
        </div>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:4 }}>📉 Gastado</div>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--red)' }}>{CRC(totalSpent)}</div>
        </div>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:4 }}>✅ Disponible</div>
          <div style={{ fontSize:16, fontWeight:700, color: available >= 0 ? 'var(--green)' : 'var(--red)' }}>{CRC(available)}</div>
        </div>
      </div>

      {totalBudgeted > 0 && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:12, fontWeight:600 }}>Progreso general</span>
            <span style={{ fontSize:12, fontWeight:700, color: overallPct>=100?'var(--red)':overallPct>=80?'var(--amber)':'var(--green)' }}>{overallPct}%</span>
          </div>
          <div style={{ height:8, background:'var(--bg3)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:4, background: overallPct>=100?'var(--red)':overallPct>=80?'var(--amber)':'var(--green)', width:`${Math.min(100,overallPct)}%`, transition:'width .5s' }} />
          </div>
        </div>
      )}

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14, marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:12 }}>📊 Categorías</div>
        {expenseCategories.map(cat => {
          const budget = budgets.find(b => b.category_id === cat.id)
          const spent = budget?.spent ?? 0
          const amount = budget?.amount ?? 0
          const pct = amount > 0 ? Math.min(100, Math.round(spent/amount*100)) : 0
          const color = pct>=100?'var(--red)':pct>=80?'var(--amber)':'var(--green)'
          return (
            <div key={cat.id} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <CategoryIcon icon={cat.icon} />
                  <span style={{ fontSize:12, fontWeight:600 }}>{cat.name}</span>
                  {pct>=100 && <span style={{ background:'var(--red-bg)', color:'var(--red)', fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:20 }}>EXCEDIDO</span>}
                  {pct>=80 && pct<100 && <span style={{ background:'var(--amber-bg)', color:'var(--amber)', fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:20 }}>ALERTA</span>}
                </div>
                {editing === cat.id ? (
                  <div style={{ display:'flex', gap:4 }}>
                    <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                      placeholder="Monto" style={{ ...inp, width:110, padding:'4px 8px', fontSize:11 }} autoFocus />
                    <button onClick={() => handleSave(cat.id)} style={{ padding:'4px 8px', background:'var(--accent)', border:'none', borderRadius:6, color:'#fff', cursor:'pointer', fontSize:11 }}>✓</button>
                    <button onClick={() => setEditing(null)} style={{ padding:'4px 8px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text2)', cursor:'pointer', fontSize:11 }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:11, color:'var(--text2)' }}>{amount > 0 ? `${CRC(spent)} / ${CRC(amount)}` : 'Sin presupuesto'}</span>
                    <button onClick={() => { setEditing(cat.id); setEditVal(amount > 0 ? String(amount) : '') }}
                      style={{ padding:'3px 8px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text2)', cursor:'pointer', fontSize:10 }}>
                      {amount > 0 ? '✏️' : '+ Fijar'}
                    </button>
                  </div>
                )}
              </div>
              {amount > 0 && (
                <>
                  <div style={{ height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:3, background:color, width:`${pct}%`, transition:'width .5s' }} />
                  </div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:3 }}>
                    {amount - spent >= 0 ? `Restante: ${CRC(amount-spent)}` : `Excedido: ${CRC(Math.abs(amount-spent))}`}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
