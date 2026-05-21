import { supabase } from './lib/supabase'
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import AppLayout from './pages/AppLayout'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
})

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, background:'var(--accent)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:22 }}>💰</div>
        <div style={{ color:'var(--text2)', fontSize:13 }}>Cargando...</div>
      </div>
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AuthCallback() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/'
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe()
            window.location.href = '/'
          }
        })
        setTimeout(() => {
          subscription.unsubscribe()
          window.location.href = '/login'
        }, 5000)
      }
    })
  }, [])

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, background:'var(--accent)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:22 }}>💰</div>
        <div style={{ color:'var(--text2)', fontSize:13 }}>Iniciando sesión con Google...</div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/*" element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
