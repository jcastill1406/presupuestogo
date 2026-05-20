# PresupuestoGo

Aplicación web de gestión de presupuesto personal en colones costarricenses.

**Stack:** React + Vite · Supabase · Vercel · TypeScript

---

## Paso 1 — Crear cuenta en Supabase (gratis)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto → ponle el nombre `presupuestogo`
3. Elige la región `us-east-1` (la más cercana a Costa Rica disponible)
4. Anota la contraseña del proyecto — la necesitarás después
5. Espera ~2 minutos a que el proyecto se cree

---

## Paso 2 — Crear la base de datos

1. En tu proyecto de Supabase, ve a **SQL Editor → New query**
2. Copia y pega el contenido de `supabase/migrations/001_initial_schema.sql`
3. Haz clic en **Run**
4. Verifica en **Table Editor** que se crearon las tablas

---

## Paso 3 — Configurar autenticación

1. En Supabase ve a **Authentication → Providers**
2. Activa **Email** (ya viene activo)
3. Para Google: activa **Google** y sigue las instrucciones para crear credenciales OAuth en Google Cloud Console
4. En **Authentication → URL Configuration**, agrega:
   - Site URL: `https://presupuestogo.cr` (o tu dominio)
   - Redirect URLs: `https://presupuestogo.cr/auth/callback`

---

## Paso 4 — Obtener las claves de API

1. Ve a **Settings → API** en tu proyecto de Supabase
2. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

---

## Paso 5 — Instalar y correr localmente

```bash
# Clonar (o crear repositorio en GitHub primero)
git clone https://github.com/tuusuario/presupuestogo.git
cd presupuestogo

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus claves de Supabase

# Correr en desarrollo
npm run dev
# Abre http://localhost:5173
```

---

## Paso 6 — Subir a GitHub

```bash
git init
git add .
git commit -m "feat: initial PresupuestoGo setup"
git branch -M main
git remote add origin https://github.com/tuusuario/presupuestogo.git
git push -u origin main
```

---

## Paso 7 — Desplegar en Vercel (gratis)

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta con GitHub
2. Haz clic en **New Project** → importa el repositorio `presupuestogo`
3. En **Environment Variables** agrega:
   ```
   VITE_SUPABASE_URL     = https://tuproyecto.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGci...
   VITE_APP_URL          = https://presupuestogo.vercel.app
   ```
4. Haz clic en **Deploy**
5. En ~2 minutos tu app estará en `https://presupuestogo.vercel.app`

---

## Paso 8 — Dominio personalizado (opcional, ~$15/año)

1. Compra `presupuestogo.cr` en [Cloudflare Registrar](https://cloudflare.com)
2. En Vercel → tu proyecto → **Settings → Domains** → agrega `presupuestogo.cr`
3. Sigue las instrucciones de DNS que te da Vercel
4. En ~15 minutos tendrás HTTPS automático

---

## Paso 9 — Notificaciones push (Edge Function)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Vincular con tu proyecto
supabase link --project-ref TU_PROJECT_REF

# Desplegar la función de notificaciones
supabase functions deploy notify

# Configurar cron diario en Supabase → Edge Functions → Schedules
# Expresión: 0 8 * * *  (8am hora CR, UTC-6 = 14:00 UTC)
```

---

## Costos estimados

| Servicio | Plan | Costo |
|---|---|---|
| Supabase | Free (500MB DB, 1GB storage) | $0/mes |
| Vercel | Free (100GB bandwidth) | $0/mes |
| GitHub | Free | $0/mes |
| Dominio .cr | Cloudflare Registrar | ~$15/año |
| **Total para empezar** | | **~$15/año** |

Cuando la app crezca y necesite más:
- Supabase Pro: $25/mes (8GB DB, backups diarios)
- Vercel Pro: $20/mes (más builds, analytics)

---

## Estructura del proyecto

```
presupuestogo/
├── src/
│   ├── components/       # Componentes UI reutilizables
│   │   ├── ui/           # Botones, inputs, cards base
│   │   ├── layout/       # Sidebar, Topbar, Layout
│   │   └── modals/       # Modales de gasto, ingreso, transferencia
│   ├── pages/            # Pantallas: Dashboard, Transactions, etc.
│   ├── hooks/            # useAuth, useTransactions, useBudget...
│   ├── lib/              # supabase.ts, api.ts
│   ├── store/            # Zustand global store
│   └── types/            # TypeScript types / Database schema
├── supabase/
│   ├── migrations/       # SQL: esquema de base de datos
│   └── functions/        # Edge Functions (notificaciones)
├── public/               # Iconos PWA, favicon
├── .env.example          # Plantilla de variables de entorno
├── vite.config.ts        # Vite + PWA
└── package.json
```

---

## Próximos pasos sugeridos

- [ ] Conectar SINPE: leer SMS con Tasker (Android) → webhook → Supabase
- [ ] Integrar Gmail API para leer estados de cuenta de tarjetas
- [ ] Tipo de cambio BCCR: API pública `https://tipocambio.bccr.fi.cr/`
- [ ] App móvil nativa con React Native + Expo (mismo backend)
