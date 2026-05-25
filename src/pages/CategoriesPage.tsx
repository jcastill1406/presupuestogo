import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCategories } from '../hooks/useCategories'
import { supabase } from '../lib/supabase'

const ICONS = ['🛒','🍔','🚗','💊','🏠','💡','📱','🎬','✈️','👕','💪','🎓','💰','🏦','💳','🎁','🐾','🌿','🔧','📦','🎮','🍺','☕','🏥','⛽','🧴','💼','📚','🎵','🏋️']
const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#84cc16','#6366f1']

interface CategoryFormProps {
  userId: string
  onSaved: () => void
  onClose: () => void
  initial?: any
}

function CategoryForm({ userId, onSaved, onClose, initial }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name || '')
  const [type, setType] = useState(initial?.type || 'expense')
  const [icon, setIcon] = useState(initial?.icon || '🛒')
  const [color, setColor] = useState(initial?.color || '#ef4444')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const inp: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'8px 11px', fontSize:13, outline:'none', boxSizing:'border-box' }

  async function handleSave() {
    if (!name) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError('')
    try {
      if (initial?.id) {
        const { error } = await supabase.from('categories').update({ name, type, icon, color }).eq('id', initial.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert({ user_id: userId, name, type, icon, color, is_system: false })
        if (error) throw error
      }
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px 12px 0 0', width:'100%', maxWidth:520, maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
        
        <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'var(--accent-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
          <div style={{ fontSize:14, fontWeight:700, flex:1 }}>{initial ? 'Editar categoría' : 'Nueva categoría'}</div>
          <div onClick={onClose} style={{ cursor:'pointer', color:'var(--text3)', fontSize:22 }}>×</div>
        </div>

        <div style={{ padding:18, overflowY:'auto', flex:1 }}>
          
          {/* Tipo */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:6 }}>Tipo</label>
            <div style={{ display:'flex', gap:4, background:'var(--bg3)', borderRadius:8, padding:3 }}>
              {[{v:'expense', l:'Gasto'}, {v:'income', l:'Ingreso'}, {v:'all', l:'Ambos'}].map(t => (
                <div key={t.v} onClick={() => setType(t.v)}
                  style={{ flex:1, padding:'6px 8px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700, background: type===t.v?'var(--accent)':'transparent', color: type===t.v?'#fff':'var(--text2)', textAlign:'center' }}>
                  {t.l}
                </div>
              ))}
            </div>
          </div>

          {/* Nombre */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:4 }}>Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Supermercado" style={inp} />
          </div>

          {/* Ícono */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:6 }}>Ícono</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {ICONS.map(i => (
                <div key={i} onClick={() => setIcon(i)}
                  style={{ width:38, height:38, borderRadius:8, border:`2px solid ${icon===i?'var(--accent)':'var(--border2)'}`, background: icon===i?'var(--accent-bg)':'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:18 }}>
                  {i}
                </div>
              ))}
            </div>
          </div>

          {/* Color */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:6 }}>Color</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)}
                  style={{ width:32, height:32, borderRadius:'50%', background:c, border:`3px solid ${color===c?'#fff':'transparent'}`, cursor:'pointer', boxShadow: color===c?`0 0 0 2px ${c}`:'none' }}>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{ padding:12, background:'var(--bg3)', borderRadius:10, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{icon}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700 }}>{name || 'Nombre de categoría'}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>{type === 'expense' ? 'Gasto' : type === 'income' ? 'Ingreso' : 'Ambos'}</div>
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

export default function CategoriesPage() {
  const { user } = useAuth()
  const { categories, loading, refetch } = useCategories(user?.id)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [filter, setFilter] = useState<'all'|'expense'|'income'>('all')

  const filtered = categories.filter(c => filter === 'all' || c.type === filter || c.type === 'all')
  const systemCats = filtered.filter(c => c.is_system)
  const customCats = filtered.filter(c => !c.is_system)

  async function deleteCategory(id: string) {
    if (!confirm('¿Eliminar esta categoría?')) return
    await supabase.from('categories').delete().eq('id', id)
    refetch()
  }

function CatCard({ c }: { c: any }) {
    const isEmoji = c.icon && /\p{Emoji}/u.test(c.icon)
    const iconDisplay = isEmoji ? c.icon : '📂'
    
    return (
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, marginBottom:6 }}>
        <div style={{ width:38, height:38, borderRadius:9, background:`${c.color || '#6366f1'}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{iconDisplay}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600 }}>{c.name}</div>
          <div style={{ fontSize:11, color:'var(--text3)' }}>{c.type === 'expense' ? 'Gasto' : c.type === 'income' ? 'Ingreso' : 'Ambos'}</div>
        </div>
        {!c.is_system && (
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => { setEditing(c); setModal(true) }}
              style={{ width:30, height:30, borderRadius:6, background:'var(--bg3)', border:'1px solid var(--border2)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✏️</button>
            <button onClick={() => deleteCategory(c.id)}
              style={{ width:30, height:30, borderRadius:6, background:'var(--red-bg)', border:'1px solid var(--red)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>🗑️</button>
          </div>
        )}
        {c.is_system && <div style={{ fontSize:10, color:'var(--text3)', background:'var(--bg3)', padding:'2px 8px', borderRadius:4, flexShrink:0 }}>Sistema</div>}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:16, fontWeight:700 }}>Categorías</div>
        <button onClick={() => { setEditing(null); setModal(true) }}
          style={{ padding:'8px 14px', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
          + Nueva
        </button>
      </div>

      <div style={{ display:'flex', gap:4, padding:3, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, marginBottom:14 }}>
        {([['all','Todas'],['expense','Gastos'],['income','Ingresos']] as const).map(([v, l]) => (
          <div key={v} onClick={() => setFilter(v)}
            style={{ flex:1, padding:'6px 8px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, background: filter===v?'var(--accent)':'transparent', color: filter===v?'#fff':'var(--text2)', textAlign:'center' }}>
            {l}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text3)' }}>Cargando...</div>
      ) : (
        <>
          {customCats.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:8 }}>Mis categorías ({customCats.length})</div>
              {customCats.map(c => <CatCard key={c.id} c={c} />)}
            </div>
          )}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', marginBottom:8 }}>Categorías del sistema ({systemCats.length})</div>
            {systemCats.map(c => <CatCard key={c.id} c={c} />)}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text3)' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📂</div>
              <div style={{ fontSize:13 }}>Sin categorías</div>
            </div>
          )}
        </>
      )}

      {modal && (
        <CategoryForm
          userId={user!.id}
          initial={editing}
          onSaved={refetch}
          onClose={() => { setModal(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
