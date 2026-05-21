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
    const { sms_text, user_token } = await req.json()

    // Verificar el usuario con su token
    const { data: { user }, error: authError } = await supabase.auth.getUser(user_token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 })
    }

    // Parsear SMS de BAC SINPE
    // Formato recibido: "SINPE Móvil: Recibió ₡15,000.00 de JUAN PEREZ. Ref: 123456"
    // Formato enviado:  "SINPE Móvil: Envió ₡15,000.00 a JUAN PEREZ. Ref: 123456"
    const receivedMatch = sms_text.match(/Recibió\s+[₡¢]?([\d,]+\.?\d*)\s+de\s+([^.]+)/i)
    const sentMatch     = sms_text.match(/Envió\s+[₡¢]?([\d,]+\.?\d*)\s+a\s+([^.]+)/i)

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

    // Registrar la transacción
    const { data, error } = await supabase.rpc('create_transaction_from_sinpe', {
      p_user_id:    user.id,
      p_amount:     amount,
      p_description: description,
      p_type:       type,
      p_date:       new Date().toISOString().split('T')[0],
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
