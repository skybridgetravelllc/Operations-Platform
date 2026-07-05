import { useState } from 'react'
import { supabase, signInWithEmail, signInWithGoogle } from '../lib/supabase'
import { Plane, Loader2, Eye, EyeOff, AlertCircle, Globe, Lock, User, Shield, CheckCircle } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState('login') // login | pending | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !password) { setError('Ingresa usuario y contraseña'); return }
    setLoading(true); setError('')
    const { error: err } = await signInWithEmail(email, password)
    setLoading(false)
    if (err) setError(err.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : err.message)
  }

  async function handleGoogle() {
    setLoading(true); setError('')
    const { error: err } = await signInWithGoogle()
    setLoading(false)
    if (err) setError(err.message)
  }

  async function handleForgot(e) {
    e.preventDefault()
    if (!email) { setError('Ingresa tu email'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    setLoading(false)
    if (err) setError(err.message)
    else setSuccess('Revisa tu correo para restablecer tu contraseña')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* LEFT - Branding */}
      <div className="hidden lg:flex flex-col w-[480px] xl:w-[560px] flex-shrink-0 bg-gradient-to-br from-slate-900 via-slate-900 to-sb-sidebaractive relative overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-sb-accent/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-sb-accent rounded-xl flex items-center justify-center shadow-lg shadow-sb-accent/30">
              <Plane className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-white text-lg font-bold">Skybridge Travel</span>
              <p className="text-slate-400 text-xs font-medium">Enterprise Platform</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Operations<br />
              <span className="text-gradient bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Center</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-12">
              Plataforma interna de gestión de reservas, clientes y comunicaciones para operadores internacionales.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: Plane, text: 'Reservas aéreas con GDS real (Duffel · Amadeus · Sabre)' },
                { icon: Globe, text: 'Gestión multicanal: WhatsApp · Instagram · Facebook' },
                { icon: Shield, text: 'Datos seguros con cifrado de extremo a extremo' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-sb-accent" />
                  </div>
                  <p className="text-slate-300 text-sm">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 pt-6">
            <p className="text-slate-500 text-xs">
              © {new Date().getFullYear()} Skybridge Travel · Plataforma confidencial de uso interno.<br />
              Versión 1.0.0 · Powered by Supabase
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-sb-accent rounded-xl flex items-center justify-center">
              <Plane className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white text-lg font-bold">Skybridge Travel</span>
          </div>

          {mode === 'login' && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-1">Bienvenido</h2>
                <p className="text-slate-400 text-sm">Inicia sesión en tu cuenta de operaciones</p>
              </div>

              {error && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="usuario@skybridge.com" autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sb-accent/40 focus:border-sb-accent/60 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sb-accent/40 focus:border-sb-accent/60 transition-all"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded accent-sb-accent" />
                    <span className="text-sm text-slate-400">Recordarme</span>
                  </label>
                  <button type="button" onClick={() => { setMode('forgot'); setError('') }} className="text-sm text-sb-accent hover:text-blue-300 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3 bg-sb-accent hover:bg-sb-accenthov text-white font-semibold rounded-xl transition-all shadow-lg shadow-sb-accent/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar Sesión'}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center"><span className="px-4 bg-slate-950 text-xs text-slate-500 uppercase tracking-wider">o continuar con</span></div>
              </div>

              <button
                onClick={handleGoogle} disabled={loading}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </button>

              <p className="text-center text-xs text-slate-600 mt-6">
                Al iniciar sesión, aceptas los términos de uso interno de Skybridge Travel
              </p>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <div className="mb-8">
                <button onClick={() => setMode('login')} className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1">← Volver</button>
                <h2 className="text-2xl font-bold text-white mb-1">Restablecer contraseña</h2>
                <p className="text-slate-400 text-sm">Te enviaremos un enlace a tu correo</p>
              </div>
              {success ? (
                <div className="flex flex-col items-center text-center py-8 gap-3">
                  <CheckCircle className="w-14 h-14 text-sb-success" />
                  <p className="text-white font-semibold">Correo enviado</p>
                  <p className="text-slate-400 text-sm">{success}</p>
                  <button onClick={() => setMode('login')} className="mt-4 text-sb-accent hover:underline">Volver al login</button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  {error && <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@skybridge.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sb-accent/40" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3 bg-sb-accent hover:bg-sb-accenthov text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar enlace'}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Pending authorization screen */}
          {mode === 'pending' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-sb-warninglt rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-sb-warning" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Pendiente de autorización</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Tu cuenta con Google ha sido registrada y está pendiente de autorización por el administrador. Recibirás un email cuando sea aprobada.
              </p>
              <button onClick={() => setMode('login')} className="mt-6 text-sb-accent hover:underline text-sm">← Volver</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
