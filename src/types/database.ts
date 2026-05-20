// ============================================================
// Tipos generados manualmente — cuando uses Supabase CLI puedes
// reemplazar con: supabase gen types typescript --local
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type TransactionType = 'expense' | 'income' | 'transfer'
export type AccountType = 'bank' | 'credit' | 'savings' | 'cash' | 'investment'
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
export type GoalStatus = 'active' | 'completed' | 'paused'
export type ReminderType = 'payment' | 'service' | 'review' | 'custom'

// ---- Perfiles ----
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  currency: string
  locale: string
  push_token: string | null
  notifications_enabled: boolean
  biometric_enabled: boolean
  created_at: string
  updated_at: string
}

// ---- Cuentas ----
export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  balance: number
  credit_limit: number | null
  bank_name: string | null
  last_four: string | null
  color: string | null
  icon: string | null
  is_active: boolean
  include_in_total: boolean
  created_at: string
  updated_at: string
}

// ---- Categorías ----
export interface Category {
  id: string
  user_id: string | null   // null = categoría del sistema
  name: string
  type: TransactionType | 'all'
  icon: string
  color: string
  is_system: boolean
  created_at: string
}

// ---- Transacciones ----
export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  type: TransactionType
  amount: number
  description: string | null
  notes: string | null
  date: string
  is_recurrent: boolean
  recurrence_frequency: RecurrenceFrequency | null
  recurrence_end_date: string | null
  is_ignored: boolean
  receipt_url: string | null
  location: string | null
  labels: string[]
  remind_at: string | null
  transfer_account_id: string | null   // para transferencias
  created_at: string
  updated_at: string
  // relaciones (joins)
  account?: Account
  category?: Category
}

// ---- Presupuesto ----
export interface Budget {
  id: string
  user_id: string
  category_id: string
  month: number   // 1-12
  year: number
  amount: number
  created_at: string
  updated_at: string
  category?: Category
  spent?: number  // calculado en query
}

// ---- Objetivos ----
export interface Goal {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  target_amount: number
  current_amount: number
  deadline: string | null
  status: GoalStatus
  account_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ---- Recordatorios ----
export interface Reminder {
  id: string
  user_id: string
  title: string
  description: string | null
  amount: number | null
  due_date: string
  type: ReminderType
  is_done: boolean
  is_recurrent: boolean
  recurrence_frequency: RecurrenceFrequency | null
  notify_days_before: number
  account_id: string | null
  created_at: string
}

// ---- Etiquetas ----
export interface Label {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

// ---- Tipo Database para Supabase client ----
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      accounts: { Row: Account; Insert: Partial<Account>; Update: Partial<Account> }
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      transactions: { Row: Transaction; Insert: Partial<Transaction>; Update: Partial<Transaction> }
      budgets: { Row: Budget; Insert: Partial<Budget>; Update: Partial<Budget> }
      goals: { Row: Goal; Insert: Partial<Goal>; Update: Partial<Goal> }
      reminders: { Row: Reminder; Insert: Partial<Reminder>; Update: Partial<Reminder> }
      labels: { Row: Label; Insert: Partial<Label>; Update: Partial<Label> }
    }
  }
}
