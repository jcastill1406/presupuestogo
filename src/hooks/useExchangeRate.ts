import { useEffect, useState } from 'react'

interface ExchangeRate {
  compra: number
  venta: number
  fuente: string
  fecha: string
}

export function useExchangeRate() {
  const [rate, setRate] = useState<ExchangeRate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRate()
  }, [])

  async function fetchRate() {
    try {
      // Primero revisar si tenemos un rate cacheado del día
      const cached = localStorage.getItem('exchange_rate')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.fecha === new Date().toISOString().split('T')[0]) {
          setRate(parsed)
          setLoading(false)
          return
        }
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/exchange-rate`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      )
      const data = await res.json()
      setRate(data)
      localStorage.setItem('exchange_rate', JSON.stringify(data))
    } catch {
      // Fallback
      setRate({ compra: 515, venta: 520, fuente: 'Fijo', fecha: new Date().toISOString().split('T')[0] })
    } finally {
      setLoading(false)
    }
  }

  // Convertir USD a CRC
  function usdToCRC(amount: number): number {
    if (!rate) return amount * 520
    return amount * rate.venta
  }

  // Convertir cualquier moneda a CRC
  function toCRC(amount: number, currency: string): number {
    if (currency === 'CRC') return amount
    if (currency === 'USD') return usdToCRC(amount)
    return amount
  }

  return { rate, loading, usdToCRC, toCRC }
}
