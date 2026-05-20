import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAccounts } from '../hooks/useAccounts'
import { supabase } from '../lib/supabase'

const CRC = (n: number) => '₡' + Math.round(n).toLocaleString('es-CR')

export default function AccountsPage() {
  const { user } = useAuth()
  const { accounts, totalBalance, refetch } = useAccounts(user?.id)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name:'', type:'bank', balance:'', credit_limit:'', bank_name:'', last_four:'' })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const inp: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'8px 11px', fontSize:13, outline:'none' }

  async function handleCreate() {
    if (!form.name || !form.type) return
    setLoading(true)
    await supabase.from('accounts').insert({
      user_id: user!.id,
      name: form.name,
      type: form.type,
      balance: parseFloat(form.balance) || 0,
      credit_limit: form.credit_limit ? parseFloat(form.credit_limit) : null,
      bank_name: form.bank_name || null,
      last_four: form.last_four || null,
      is_active: true,
      include_in_total: true,
    })
    setForm({ name:'', type:'bank', balance:'', credit_limit:'', bank_name:'', last_four:'' })
    setShowForm(false)
    setLoading(false)
    refetch()
  }

  async function archiveAccount(id: string) {
    if (!confirm('¿Archivar esta cuenta?')) return
    await supabase.from('accounts').update({ is_active: false }).eq('id', id)
    refetch()
  }

  const typeIcon = (t: string) => t==='credit'?'💳':t==='savings'?'🐷':t==='cash'?'💵':'🏦'
  const typeColor = (t: string) => t==='credit'?'var(--purple)':t==='savings'?'var(--green)':t==='cash'?'var(--amber)':'var(--blue)'
  const typeBg = (t: string) => t==='credit'?'#1a0f2a':t==='savings'?'var(--green-bg)':t==='cash'?'var(--amber-bg)':'var(--blue-bg)'

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 16px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:3 }}>💰 Patrimonio total</div>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--text)' }}>{CRC(totalBalance)}</div>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding:'9px 16px', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>
          {showForm ? '✕ Cancelar' : '＋ Agregar cuenta'}
        </button>
      </div>

      {showForm && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--accent)', borderRadius:12, padding:16, marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Nueva cuenta</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Nombre *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="BAC San José" style={inp} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Tipo *</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...inp, appearance:'none' }}>
                <option value="bank">🏦 Banco</option>
                <option value="credit">💳 Tarjeta crédito</option>
                <option value="savings">🐷 Ahorro</option>
                <option value="cash">💵 Efectivo</option>
                <option value="investment">📈 Inversión</option>
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Saldo inicial (₡)</label>
              <input type="number" value={form.balance} onChange={e => set('balance', e.target.value)} placeholder="0" style={inp} />
            </div>
            {form.type === 'credit' && (
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Límite de crédito (₡)</label>
                <input type="number" value={form.credit_limit} onChange={e => set('credit_limit', e.target.value)} placeholder="0" style={inp} />
              </div>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Banco</label>
              <input value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder="BAC, BN, BCR..." style={inp} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Últimos 4 dígitos</label>
              <input value={form.last_four} onChange={e => set('last_four', e.target.value)} placeholder="1234" maxLength={4} style={inp} />
            </div>
          </div>
          <button onClick={handleCreate} disabled={loading} style={{ width:'100%', padding:10, background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, opacity: loading?.7:1 }}>
            {loading ? 'Guardando...' : '💾 Crear cuenta'}
          </button>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {accounts.length === 0 ? (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🏦</div>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:6, color:'var(--text2)' }}>Sin cuentas aún</div>
            <div style={{ fontSize:12 }}>Agrega tu primera cuenta bancaria o tarjeta</div>
          </div>
        ) : accounts.map(a => (
          <div key={a.id} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:14, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background: typeColor(a.type) }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>{a.name}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{a.last_four ? `**** ${a.last_four}` : a.bank_name || a.type}</div>
              </div>
              <div style={{ width:36, height:36, borderRadius:9, background: typeBg(a.type), display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{typeIcon(a.type)}</div>
            </div>
            <div style={{ fontSize:20, fontWeight:800, color: a.balance < 0 ? 'var(--red)' : 'var(--text)', marginBottom:6 }}>{CRC(a.balance)}</div>
            {a.type === 'credit' && a.credit_limit && (
              <div style={{ marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:10, color:'var(--text3)' }}>Usado: {CRC(Math.abs(a.balance))}</span>
                  <span style={{ fontSize:10, color:'var(--text3)' }}>Límite: {CRC(a.credit_limit)}</span>
                </div>
                <div style={{ height:5, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:3, background:'var(--purple)', width:`${Math.min(100, Math.round(Math.abs(a.balance)/a.credit_limit*100))}%` }} />
                </div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:3 }}>Disponible: {CRC(a.credit_limit - Math.abs(a.balance))}</div>
              </div>
            )}
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => window.location.href='/movimientos'} style={{ flex:1, padding:'6px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text2)', cursor:'pointer', fontSize:11, fontWeight:600 }}>📋 Movimientos</button>
              <button onClick={() => archiveAccount(a.id)} style={{ padding:'6px 8px', background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:6, color:'var(--red)', cursor:'pointer', fontSize:11 }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
