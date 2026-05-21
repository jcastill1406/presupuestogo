import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { sms_text, api_key } = await req.json()

    if (!api_key) {
      return new Response(JSON.stringify({ error: 'API key requerida' }), { status: 401 })
    }

    // Verificar API key permanente
    const { data: userId, error: keyError } = await supabase
      .rpc('verify_api_key', { p_key: api_key })

    if (keyError || !userId) {
      return new Response(JSON.stringify({ error: 'API key invalida' }), { status: 401 })
    }

    // Parsear SMS de BAC SINPE
    const receivedMatch = sms_text.match(/Recib[ióio]+\s+[₡¢]?([\d,]+\.?\d*)\s+de\s+([^.]+)/i)
    const sentMatch     = sms_text.match(/Envi[óo]+\s+[₡¢]?([\d,]+\.?\d*)\s+a\s+([^.]+)/i)

    let amount: number
    let description: string
    let type: string

    if (receivedMatch) {
      amount      = parseFloat(receivedMatch[1].replace(/,/g, ''))
      description = `SINPE recibido de ${receivedMatch[2].trim()}`
      type        = 'income'
    } else if (sentMatch) {
      amount      = parseFloat(sentMatch[1].replace(/,/g, ''))
      description = `SINPE enviado a ${sentMatch[2].trim()}`
      type        = 'expense'
    } else {
      return new Response(JSON.stringify({ error: 'SMS no reconocido', sms: sms_text }), { status: 400 })
    }

    const { data, error } = await supabase.rpc('create_transaction_from_sinpe', {
      p_user_id:     userId,
      p_amount:      amount,
      p_description: description,
      p_type:        type,
      p_date:        new Date().toISOString().split('T')[0],
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
