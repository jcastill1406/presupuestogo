import { useState } from 'react'

const CRC = (n: number) => '₡' + Math.round(n).toLocaleString('es-CR')

export default function CalculatorsPage() {
  const [active, setActive] = useState('compound')
  const [compound, setCompound] = useState({ principal:'500000', monthly:'50000', rate:'8', years:'10' })
  const [loan, setLoan] = useState({ amount:'5000000', rate:'12', months:'36' })
  const [savings, setSavings] = useState({ income:'1000000', expenses:'700000' })

  const calcCompound = () => {
    const P = parseFloat(compound.principal)||0
    const PMT = parseFloat(compound.monthly)||0
    const r = (parseFloat(compound.rate)||0)/100/12
    const n = (parseFloat(compound.years)||0)*12
    if(r === 0) return { fv: P + PMT*n, invested: P + PMT*n, interest: 0 }
    const fv = P*Math.pow(1+r,n) + PMT*(Math.pow(1+r,n)-1)/r
    const invested = P + PMT*n
    return { fv, invested, interest: fv-invested }
  }

  const calcLoan = () => {
    const P = parseFloat(loan.amount)||0
    const r = (parseFloat(loan.rate)||0)/100/12
    const n = parseFloat(loan.months)||0
    if(r === 0) return { payment: P/n, total: P, interest: 0 }
    const payment = P * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1)
    const total = payment * n
    return { payment, total, interest: total-P }
  }

  const calcSavings = () => {
    const inc = parseFloat(savings.income)||0
    const exp = parseFloat(savings.expenses)||0
    const net = inc - exp
    const rate = inc > 0 ? net/inc*100 : 0
    return { net, rate, yearly: net*12, emergency: net*6 }
  }

  const c = calcCompound()
  const l = calcLoan()
  const s = calcSavings()

  const inp: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'8px 11px', fontSize:13, outline:'none' }
  const tabs = [{ id:'compound', label:'📈 Interés compuesto' }, { id:'loan', label:'💳 Préstamo' }, { id:'savings', label:'🏦 Ahorro' }]

  return (
    <div>
      <div style={{ display:'flex', gap:4, padding:3, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, marginBottom:14 }}>
        {tabs.map(t => (
          <div key={t.id} onClick={() => setActive(t.id)}
            style={{ flex:1, padding:'7px 8px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, background: active===t.id?'var(--accent)':'transparent', color: active===t.id?'#fff':'var(--text2)', textAlign:'center' }}>
            {t.label}
          </div>
        ))}
      </div>

      {active === 'compound' && (
        <div>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:12 }}>Calculadora de interés compuesto</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { label:'Capital inicial (₡)', key:'principal', state:compound, setter:setCompound },
                { label:'Aporte mensual (₡)', key:'monthly', state:compound, setter:setCompound },
                { label:'Tasa anual (%)', key:'rate', state:compound, setter:setCompound },
                { label:'Plazo (años)', key:'years', state:compound, setter:setCompound },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>{f.label}</label>
                  <input type="number" value={(f.state as any)[f.key]}
                    onChange={e => f.setter((p:any) => ({ ...p, [f.key]: e.target.value }))} style={inp} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[
              { label:'Valor final', val:CRC(c.fv), color:'var(--green)' },
              { label:'Total aportado', val:CRC(c.invested), color:'var(--text)' },
              { label:'Intereses ganados', val:CRC(c.interest), color:'var(--amber)' },
            ].map(r => (
              <div key={r.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:4 }}>{r.label}</div>
                <div style={{ fontSize:15, fontWeight:700, color:r.color }}>{r.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {active === 'loan' && (
        <div>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:12 }}>Calculadora de préstamo</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              {[
                { label:'Monto del préstamo (₡)', key:'amount' },
                { label:'Tasa anual (%)', key:'rate' },
                { label:'Plazo (meses)', key:'months' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>{f.label}</label>
                  <input type="number" value={(loan as any)[f.key]}
                    onChange={e => setLoan(p => ({ ...p, [f.key]: e.target.value }))} style={inp} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[
              { label:'Cuota mensual', val:CRC(l.payment), color:'var(--accent2)' },
              { label:'Total a pagar', val:CRC(l.total), color:'var(--text)' },
              { label:'Total intereses', val:CRC(l.interest), color:'var(--red)' },
            ].map(r => (
              <div key={r.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:4 }}>{r.label}</div>
                <div style={{ fontSize:15, fontWeight:700, color:r.color }}>{r.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {active === 'savings' && (
        <div>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:12 }}>Calculadora de tasa de ahorro</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { label:'Ingresos mensuales (₡)', key:'income' },
                { label:'Gastos mensuales (₡)', key:'expenses' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>{f.label}</label>
                  <input type="number" value={(savings as any)[f.key]}
                    onChange={e => setSavings(p => ({ ...p, [f.key]: e.target.value }))} style={inp} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { label:'Ahorro mensual', val:CRC(s.net), color: s.net>=0?'var(--green)':'var(--red)' },
              { label:'Tasa de ahorro', val:`${Math.round(s.rate)}%`, color: s.rate>=20?'var(--green)':s.rate>=10?'var(--amber)':'var(--red)' },
              { label:'Ahorro anual', val:CRC(s.yearly), color:'var(--amber)' },
              { label:'Fondo emergencia (6m)', val:CRC(s.emergency), color:'var(--blue)' },
            ].map(r => (
              <div key={r.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:4 }}>{r.label}</div>
                <div style={{ fontSize:15, fontWeight:700, color:r.color }}>{r.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
