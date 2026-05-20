import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Transaction } from '../types/database'

export function useTransactions(userId: string | undefined, month: number, year: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchTransactions()

    const sub = supabase
      .channel('transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        () => fetchTransactions()
      ).subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [userId, month, year])

  async function fetchTransactions() {
    setLoading(true)
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = new Date(year, month, 0).toISOString().split('T')[0]

    const { data } = await supabase
      .from('transactions')
      .select('*, account:accounts(name, type), category:categories(name, icon, color)')
      .eq('user_id', userId!)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    setTransactions(data ?? [])
    setLoading(false)
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income' && !t.is_ignored)
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && !t.is_ignored)
    .reduce((sum, t) => sum + t.amount, 0)

  const savings = totalIncome - totalExpenses

  return { transactions, loading, totalIncome, totalExpenses, savings, refetch: fetchTransactions }
}
