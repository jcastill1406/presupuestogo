import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Goal } from '../types/database'

export function useGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchGoals()
  }, [userId])

  async function fetchGoals() {
    setLoading(true)
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false })
    setGoals(data ?? [])
    setLoading(false)
  }

  async function createGoal(goal: Partial<Goal>) {
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...goal, user_id: userId })
      .select()
      .single()
    if (error) throw error
    setGoals(prev => [data, ...prev])
    return data
  }

  async function addContribution(goalId: string, amount: number) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const newAmount = goal.current_amount + amount
    const status = newAmount >= goal.target_amount ? 'completed' : 'active'
    const { error } = await supabase
      .from('goals')
      .update({ current_amount: newAmount, status, updated_at: new Date().toISOString() })
      .eq('id', goalId)
    if (error) throw error
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: newAmount, status } : g))
  }

  async function deleteGoal(id: string) {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  return { goals, loading, createGoal, addContribution, deleteGoal, refetch: fetchGoals }
}
