import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Budget } from '../types/database'

export function useBudget(userId: string | undefined, month: number, year: number) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchBudgets()
  }, [userId, month, year])

  async function fetchBudgets() {
    setLoading(true)
    const { data: budgetData } = await supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('user_id', userId!)
      .eq('month', month)
      .eq('year', year)

    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: txData } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', userId!)
      .eq('type', 'expense')
      .eq('is_ignored', false)
      .gte('date', start)
      .lte('date', end)

    const spentMap: Record<string, number> = {}
    txData?.forEach(t => {
      if (t.category_id) spentMap[t.category_id] = (spentMap[t.category_id] ?? 0) + t.amount
    })

    const withSpent = (budgetData ?? []).map(b => ({ ...b, spent: spentMap[b.category_id] ?? 0 }))
    setBudgets(withSpent)
    setLoading(false)
  }

  async function upsertBudget(categoryId: string, amount: number) {
    const { error } = await supabase
      .from('budgets')
      .upsert({ user_id: userId, category_id: categoryId, month, year, amount },
        { onConflict: 'user_id,category_id,month,year' })
    if (error) throw error
    fetchBudgets()
  }

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + (b.spent ?? 0), 0)

  return { budgets, loading, totalBudgeted, totalSpent, upsertBudget, refetch: fetchBudgets }
}
