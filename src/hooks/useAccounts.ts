import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Account } from '../types/database'

export function useAccounts(userId: string | undefined) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchAccounts()

    // Suscripción en tiempo real
    const sub = supabase
      .channel('accounts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` },
        () => fetchAccounts()
      ).subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [userId])

  async function fetchAccounts() {
    setLoading(true)
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId!)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    setAccounts(data ?? [])
    setLoading(false)
  }

  const totalBalance = accounts
    .filter(a => a.include_in_total)
    .reduce((sum, a) => sum + a.balance, 0)

  return { accounts, loading, totalBalance, refetch: fetchAccounts }
}
