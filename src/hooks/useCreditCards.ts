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

  // Calcular período actual de la tarjeta
  function getCurrentPeriod(card: CreditCard) {
    const today = new Date()
    const cutDay = card.cut_day
    let periodStart: Date
    let periodEnd: Date

    if (today.getDate() <= cutDay) {
      // Antes del corte - período del mes anterior al actual
      periodEnd = new Date(today.getFullYear(), today.getMonth(), cutDay)
      periodStart = new Date(today.getFullYear(), today.getMonth() - 1, cutDay + 1)
    } else {
      // Después del corte - período actual al próximo corte
      periodStart = new Date(today.getFullYear(), today.getMon
