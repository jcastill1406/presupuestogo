import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Category } from '../types/database'

export function useCategories(userId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchCategories()
  }, [userId])

  async function fetchCategories() {
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*')
      .or(`is_system.eq.true,user_id.eq.${userId}`)
      .order('name', { ascending: true })
    setCategories(data ?? [])
    setLoading(false)
  }

  async function createCategory(name: string, type: string, icon: string, color: string) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ user_id: userId, name, type, icon, color, is_system: false })
      .select()
      .single()
    if (error) throw error
    setCategories(prev => [...prev, data])
    return data
  }

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'all')
  const incomeCategories = categories.filter(c => c.type === 'income' || c.type === 'all')

  return { categories, expenseCategories, incomeCategories, loading, createCategory, refetch: fetchCategories }
}
