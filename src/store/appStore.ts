import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Account, Transaction, Budget, Goal, Reminder, Category } from '../types/database'

interface AppState {
  // Datos
  accounts: Account[]
  transactions: Transaction[]
  budgets: Budget[]
  goals: Goal[]
  reminders: Reminder[]
  categories: Category[]

  // UI
  selectedPeriod: 'month' | '3months' | 'year'
  selectedMonth: number
  selectedYear: number
  travelMode: boolean
  travelCurrency: string
  travelRate: number

  // Setters
  setAccounts: (accounts: Account[]) => void
  setTransactions: (transactions: Transaction[]) => void
  setBudgets: (budgets: Budget[]) => void
  setGoals: (goals: Goal[]) => void
  setReminders: (reminders: Reminder[]) => void
  setCategories: (categories: Category[]) => void
  setPeriod: (period: 'month' | '3months' | 'year') => void
  setTravelMode: (active: boolean, currency?: string, rate?: number) => void

  // Helpers computados
  getTotalBalance: () => number
  getMonthlyIncome: () => number
  getMonthlyExpenses: () => number
  getMonthlySavings: () => number
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      accounts: [],
      transactions: [],
      budgets: [],
      goals: [],
      reminders: [],
      categories: [],
      selectedPeriod: 'month',
      selectedMonth: new Date().getMonth() + 1,
      selectedYear: new Date().getFullYear(),
      travelMode: false,
      travelCurrency: 'USD',
      travelRate: 515,

      setAccounts: (accounts) => set({ accounts }),
      setTransactions: (transactions) => set({ transactions }),
      setBudgets: (budgets) => set({ budgets }),
      setGoals: (goals) => set({ goals }),
      setReminders: (reminders) => set({ reminders }),
      setCategories: (categories) => set({ categories }),
      setPeriod: (selectedPeriod) => set({ selectedPeriod }),
      setTravelMode: (travelMode, travelCurrency = 'USD', travelRate = 515) =>
        set({ travelMode, travelCurrency, travelRate }),

      getTotalBalance: () =>
        get().accounts
          .filter((a) => a.include_in_total && a.is_active)
          .reduce((sum, a) => sum + a.balance, 0),

      getMonthlyIncome: () => {
        const { transactions, selectedMonth, selectedYear } = get()
        return transactions
          .filter(
            (t) =>
              t.type === 'income' &&
              !t.is_ignored &&
              new Date(t.date).getMonth() + 1 === selectedMonth &&
              new Date(t.date).getFullYear() === selectedYear
          )
          .reduce((sum, t) => sum + t.amount, 0)
      },

      getMonthlyExpenses: () => {
        const { transactions, selectedMonth, selectedYear } = get()
        return transactions
          .filter(
            (t) =>
              t.type === 'expense' &&
              !t.is_ignored &&
              new Date(t.date).getMonth() + 1 === selectedMonth &&
              new Date(t.date).getFullYear() === selectedYear
          )
          .reduce((sum, t) => sum + t.amount, 0)
      },

      getMonthlySavings: () => get().getMonthlyIncome() - get().getMonthlyExpenses(),
    }),
    {
      name: 'presupuestogo-store',
      partialize: (state) => ({
        selectedPeriod: state.selectedPeriod,
        selectedMonth: state.selectedMonth,
        selectedYear: state.selectedYear,
        travelMode: state.travelMode,
        travelCurrency: state.travelCurrency,
        travelRate: state.travelRate,
      }),
    }
  )
)
