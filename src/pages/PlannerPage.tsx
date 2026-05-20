import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import { useReminders } from '../hooks/useReminders'

const CRC = (n: number) => '₡' + Math.round(n).toLocaleString('es-CR')

export default function PlannerPage() {
  const { user } = useAuth()
  const now = new Date()
  const [month] = useState(now.getMonth() + 1)
  const [year] = useState(now.getFullYear())
  const { transactions, totalIncome, totalExpenses } = useTransactions(user?.id, month, year)
  const { pending } = useReminders(user?.id)
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDay = (new Date(year, month-1, 1).getDay() + 6) % 7
  const today = now.getDate()

  const eventsByDay: Record<number, {label:string, color:string}[]> = {}
  pending.forEach(r => {
    const d = new Date(r.due_date)
    if (d.getMonth()+1 === month && d.getFullYear() === year) {
      const day = d.getDate()
      if (!eventsByDay[day]) eventsByDay[day] = []
      eventsByDay[day].push({ label: r.title, color: r.type==='payment'?'var(--red)':r.type==='service'?'var(--blue)':'var(--amber)' })
    }
  })

  const recurrent = transactions.filter(t => t.is_recurrent)
  const projected = totalIncome - totalExpenses

  return (
    <div>
      <div style={{ marginBottom:14, fontSize:15, fontWeight:700 }}>{months[month-1]} {year}</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:10 }}>📅 Calendario</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1, marginBottom:6 }}>
            {['L','M','X','J','V','S','D'].map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:9, fontWeight:700, color:'var(--text3)', padding:'2px' }}>{d}</div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1 }}>
            {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i+1
              const events = eventsByDay[day] || []
              const isToday = day === today
              return (
                <div key={day} style={{ aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderRadius:4, background: isToday?'var(--accent)':'transparent', cursor:'pointer' }}>
                  <span style={{ fontSize:10, fontWeight: isToday?'700':'400', color: isToday?'#fff':'var(--text)' }}>{day}</span>
                  {events.length > 0 && <div style={{ width:4, height:4, borderRadius:'50%', background: isToday?'#fff':events[0].color, marginTop:1 }} />}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:10 }}>💰 Flujo proyectado</div>
          {[
            { label:'Ingresos registrados', val:totalIncome, color:'var(--green)' },
            { label:'Gastos registrados', val:totalExpenses, color:'var(--red)' },
            { label:'Balance proyectado', val:projected, color: projected>=0?'var(--amber)':'var(--red)' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:12, color:'var(--text2)' }}>{r.label}</span>
              <span style={{ fontSize:13, fontWeight:700, color:r.color }}>{CRC(r.val)}</span>
            </div>
          ))}
          <div style={{ marginTop:10, padding:10, background: projected>=0?'var(--green-bg)':'var(--red-bg)', borderRadius:8, border:`1px solid ${projected>=0?'var(--green-dim)':'var(--red-dim)'}` }}>
            <div style={{ fontSize:11, fontWeight:700, color: projected>=0?'var(--green)':'var(--red)' }}>
              {projected>=0 ? '✓ Proyección positiva' : '⚠️ Gastos superan ingresos'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14, marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:10 }}>🔄 Gastos recurrentes</div>
        {recurrent.length === 0 ? (
          <div style={{ textAlign:'center', padding:'16px 0', color:'var(--text3)', fontSize:12 }}>Sin gastos recurrentes registrados</div>
        ) : recurrent.map(t => (
          <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontSize:16 }}>{t.type==='income'?'📈':'📉'}</span>
            <span style={{ flex:1, fontSize:12, fontWeight:500 }}>{t.description || t.category?.name || 'Sin descripción'}</span>
            <span style={{ fontSize:12, fontWeight:700, color: t.type==='income'?'var(--green)':'var(--red)' }}>
              {t.type==='income'?'+':'-'}{CRC(t.amount)}
            </span>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:10 }}>🔔 Próximos vencimientos</div>
        {pending.slice(0,5).length === 0 ? (
          <div style={{ textAlign:'center', padding:'16px 0', color:'var(--text3)', fontSize:12 }}>Sin vencimientos próximos</div>
        ) : pending.slice(0,5).map(r => (
          <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontSize:16 }}>{r.type==='payment'?'💳':r.type==='service'?'🏠':'📋'}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600 }}>{r.title}</div>
              <div style={{ fontSize:10, color:'var(--text3)' }}>{r.due_date}</div>
            </div>
            {r.amount ? <span style={{ fontSize:12, fontWeight:700, color:'var(--red)' }}>{CRC(r.amount)}</span> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
