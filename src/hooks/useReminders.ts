import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Reminder } from '../types/database'

export function useReminders(userId: string | undefined) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchReminders()
  }, [userId])

  async function fetchReminders() {
    setLoading(true)
    const in30days = new Date()
    in30days.setDate(in30days.getDate() + 30)

    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId!)
      .lte('due_date', in30days.toISOString().split('T')[0])
      .order('due_date', { ascending: true })

    setReminders(data ?? [])
    setLoading(false)
  }

  async function markDone(id: string) {
    await supabase.from('reminders').update({ is_done: true }).eq('id', id)
    setReminders(prev => prev.map(r => r.id === id ? { ...r, is_done: true } : r))
  }

  async function createReminder(reminder: Partial<Reminder>) {
    const { data, error } = await supabase
      .from('reminders')
      .insert({ ...reminder, user_id: userId })
      .select()
      .single()
    if (error) throw error
    setReminders(prev => [...prev, data])
    return data
  }

  async function deleteReminder(id: string) {
    await supabase.from('reminders').delete().eq('id', id)
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  const pending = reminders.filter(r => !r.is_done)
  const overdue = pending.filter(r => new Date(r.due_date) < new Date())

  return { reminders, pending, overdue, loading, markDone, createReminder, deleteReminder, refetch: fetchReminders }
}
