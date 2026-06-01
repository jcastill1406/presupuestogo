import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useExchangeRate } from './useExchangeRate'
import type { Transaction } from '../types/database'

export function useTransactions(userId: string | undefined, month: number, year: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const { toCRC } = useExchangeRate()

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

    const [{ data: txData }, { data: accData }, { data: catData }] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId!)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('accounts')
        .select('id, name, type')
        .eq('user_id', userId!),
      supabase
        .from('categories')
        .select('id, name, icon, color'),
    ])

    const enriched = (txData ?? []).map(t => ({
      ...t,
      account: accData?.find(a => a.id === t.account_id) ?? null,
      category: catData?.find(c => c.id === t.category_id) ?? null,
    }))

    setTransactions(enriched as Transaction[])
    setLoading(false)
  }

  // Totales convertidos a CRC
  const totalIncome = transactions
    .filter(t => t.type === 'income' && !t.is_ignored)
    .reduce((sum, t) => sum + toCRC(t.amount, (t as any).currency || 'CRC'), 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && !t.is_ignored)
    .reduce((sum, t) => sum + toCRC(t.amount, (t as any).currency || 'CRC'), 0)

  const savings = totalIncome - totalExpenses

  return { transactions, loading, totalIncome, totalExpenses, savings, refetch: fetchTransactions }
}
