import { supabase } from './supabase'
import type { Transaction, Account, Budget, Goal, Reminder, Category } from '../types/database'

// ============================================================
// TRANSACCIONES
// ============================================================
export const transactionService = {
  async getByMonth(userId: string, year: number, month: number): Promise<Transaction[]> {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = new Date(year, month, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('transactions')
      .select('*, account:accounts(*), category:categories(*)')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async create(tx: Partial<Transaction>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(tx)
      .select('*, account:accounts(*), category:categories(*)')
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, tx: Partial<Transaction>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update({ ...tx, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, account:accounts(*), category:categories(*)')
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
  },

  async uploadReceipt(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${userId}/receipts/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('receipts')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (error) throw error

    const { data } = supabase.storage.from('receipts').getPublicUrl(path)
    return data.publicUrl
  },
}

// ============================================================
// CUENTAS
// ============================================================
export const accountService = {
  async getAll(userId: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async create(account: Partial<Account>): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .insert(account)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, account: Partial<Account>): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .update({ ...account, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  },
}

// ============================================================
// CATEGORÍAS
// ============================================================
export const categoryService = {
  async getAll(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`is_system.eq.true,user_id.eq.${userId}`)
      .order('name', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async create(category: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single()

    if (error) throw error
    return data
  },
}

// ============================================================
// PRESUPUESTO
// ============================================================
export const budgetService = {
  async getByMonth(userId: string, year: number, month: number): Promise<Budget[]> {
    const { data: budgets, error } = await supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month)

    if (error) throw error

    // Calcular lo gastado por categoría en el mes
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: txs } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .eq('is_ignored', false)
      .gte('date', start)
      .lte('date', end)

    const spentByCategory: Record<string, number> = {}
    txs?.forEach((t) => {
      if (t.category_id) {
        spentByCategory[t.category_id] = (spentByCategory[t.category_id] ?? 0) + t.amount
      }
    })

    return (budgets ?? []).map((b) => ({
      ...b,
      spent: spentByCategory[b.category_id] ?? 0,
    }))
  },

  async upsert(budget: Partial<Budget>): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .upsert(budget, { onConflict: 'user_id,category_id,month,year' })
      .select('*, category:categories(*)')
      .single()

    if (error) throw error
    return data
  },
}

// ============================================================
// OBJETIVOS
// ============================================================
export const goalService = {
  async getAll(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async create(goal: Partial<Goal>): Promise<Goal> {
    const { data, error } = await supabase.from('goals').insert(goal).select().single()
    if (error) throw error
    return data
  },

  async addContribution(goalId: string, amount: number): Promise<void> {
    const { data: goal, error: fetchError } = await supabase
      .from('goals')
      .select('current_amount, target_amount')
      .eq('id', goalId)
      .single()

    if (fetchError) throw fetchError

    const newAmount = goal.current_amount + amount
    const status = newAmount >= goal.target_amount ? 'completed' : 'active'

    const { error } = await supabase
      .from('goals')
      .update({ current_amount: newAmount, status, updated_at: new Date().toISOString() })
      .eq('id', goalId)

    if (error) throw error
  },
}

// ============================================================
// RECORDATORIOS
// ============================================================
export const reminderService = {
  async getUpcoming(userId: string, daysAhead = 30): Promise<Reminder[]> {
    const until = new Date()
    until.setDate(until.getDate() + daysAhead)

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .lte('due_date', until.toISOString().split('T')[0])
      .order('due_date', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async markDone(id: string): Promise<void> {
    const { error } = await supabase
      .from('reminders')
      .update({ is_done: true })
      .eq('id', id)

    if (error) throw error
  },

  async create(reminder: Partial<Reminder>): Promise<Reminder> {
    const { data, error } = await supabase
      .from('reminders')
      .insert(reminder)
      .select()
      .single()

    if (error) throw error
    return data
  },
}

// ============================================================
// UTILIDADES
// ============================================================
export const formatCRC = (amount: number): string =>
  '₡' + Math.round(amount).toLocaleString('es-CR')

export const getCurrentMonthRange = () => {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}
