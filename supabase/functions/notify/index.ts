// Supabase Edge Function — notificaciones push
// Deploy: supabase functions deploy notify
// Se ejecuta como cron diario para recordatorios que vencen pronto

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const today = new Date().toISOString().split('T')[0]

  // Buscar recordatorios que vencen en los próximos 3 días
  const in3days = new Date()
  in3days.setDate(in3days.getDate() + 3)
  const until = in3days.toISOString().split('T')[0]

  const { data: reminders } = await supabase
    .from('reminders')
    .select('*, profiles(push_token, full_name, notifications_enabled)')
    .eq('is_done', false)
    .gte('due_date', today)
    .lte('due_date', until)

  const notifications = []

  for (const reminder of reminders ?? []) {
    const profile = reminder.profiles
    if (!profile?.push_token || !profile.notifications_enabled) continue

    const daysUntil = Math.ceil(
      (new Date(reminder.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    const body = daysUntil === 0
      ? `Vence hoy: ${reminder.title}`
      : daysUntil === 1
      ? `Vence mañana: ${reminder.title}`
      : `Vence en ${daysUntil} días: ${reminder.title}`

    // Enviar usando Web Push (si tienes VAPID keys configuradas)
    // En producción integrar con Firebase FCM o Expo Push
    notifications.push({
      to: profile.push_token,
      title: 'PresupuestoGo',
      body,
      data: { type: 'reminder', id: reminder.id },
    })
  }

  // También verificar presupuestos excedidos
  const { data: budgets } = await supabase.rpc('get_budget_alerts')
  for (const alert of budgets ?? []) {
    if (alert.push_token && alert.notifications_enabled) {
      notifications.push({
        to: alert.push_token,
        title: 'Alerta de presupuesto',
        body: `${alert.category_name}: alcanzaste el ${alert.percentage}% de tu presupuesto mensual`,
        data: { type: 'budget', category_id: alert.category_id },
      })
    }
  }

  return new Response(
    JSON.stringify({ sent: notifications.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
