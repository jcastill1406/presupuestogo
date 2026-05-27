import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface CreditCard {
  id: string
  user_id: string
  name: string
  last_four: string
  bank: string
  cut_day: number
  payment_day: number
  credit_limit: number
  currency: string
  color: string
  is_active: boolean
}

export interface CreditCardPayment {
  id: string
  credit_card_id: string
  amount: number
  payment_date: string
  period_start: string
  period_end: string
  notes: string
}

export function useCreditCards(userId: string | undefined) {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchCards()
  }, [userId])

  async function fetchCards() {
    setLoading(true)
    const { data } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', userId!)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    setCards(data ?? [])
    setLoading(false)
  }

  async function createCard(card: Omit<CreditCard, 'id' | 'user_id' | 'is_active'>) {
    const { data, error } = await supabase
      .from('credit_cards')
      .insert({ ...card, user_id: userId })
      .select()
      .single()
    if (error) throw error
    setCards(prev => [...prev, data])
    return data
  }

  async function updateCard(id: string, updates: Partial<CreditCard>) {
    const { error } = await supabase
      .from('credit_cards')
      .update(updates)
      .eq('id', id)
    if (error) throw error
    fetchCards()
  }

  async function deleteCard(id: string) {
    const { error } = await supabase
      .from('credit_cards')
      .update({ is_active: false })
      .eq('id', id)
    if (error) throw error
    fetchCards()
  }

  function getCurrentPeriod(card: CreditCard) {
    const today = new Date()
    const cutDay = card.cut_day
    let periodStart: Date
    let periodEnd: Date

    if (today.getDate() <= cutDay) {
      periodEnd = new Date(today.getFullYear(), today.getMonth(), cutDay)
      periodStart = new Date(today.getFullYear(), today.getMonth() - 1, cutDay + 1)
    } else {
      periodStart = new Date(today.getFullYear(), today.getMonth(), cutDay + 1)
      periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, cutDay)
    }

    return {
      start: periodStart.toISOString().split('T')[0],
      end: periodEnd.toISOString().split('T')[0],
    }
  }

  function getNextPaymentDate(card: CreditCard) {
    const today = new Date()
    let paymentDate = new Date(today.getFullYear(), today.getMonth(), card.payment_day)
    if (paymentDate <= today) {
      paymentDate = new Date(today.getFullYear(), today.getMonth() + 1, card.payment_day)
    }
    return paymentDate.toISOString().split('T')[0]
  }

  async function getCardTransactions(cardId: string, periodStart: string, periodEnd: string) {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('credit_card_id', cardId)
      .gte('date', periodStart)
      .lte('date', periodEnd)
      .order('date', { ascending: false })
    return data ?? []
  }

  async function registerPayment(
    cardId: string,
    amount: number,
    paymentDate: string,
    periodStart: string,
    periodEnd: string,
    notes?: string
  ) {
    const { data, error } = await supabase
      .from('credit_card_payments')
      .insert({
        user_id: userId,
        credit_card_id: cardId,
        amount,
        payment_date: paymentDate,
        period_start: periodStart,
        period_end: periodEnd,
        notes: notes || null,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function getCardPayments(cardId: string) {
    const { data } = await supabase
      .from('credit_card_payments')
      .select('*')
      .eq('credit_card_id', cardId)
      .order('payment_date', { ascending: false })
    return data ?? []
  }

  return {
    cards,
    loading,
    createCard,
    updateCard,
    deleteCard,
    getCurrentPeriod,
    getNextPaymentDate,
    getCardTransactions,
    registerPayment,
    getCardPayments,
    refetch: fetchCards,
  }
}
