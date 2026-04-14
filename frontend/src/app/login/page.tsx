'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { Wifi, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, X, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Branding
  const [logoUrl, setLogoUrl] = useState('')
  const [brandName, setBrandName] = useState('OmniFlow')

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotDone, setForgotDone] = useState(false)
  const [forgotError, setForgotError] = useState('')

  useEffect(() => {
    if (localStorage.getItem('omniflow_token')) {
      router.push('/dashboard')
    }
    // Fetch public branding (no auth needed)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1'
    fetch(`${apiUrl}/tenants/public-info`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.name) setBrandName(d.name)
        if (d?.settings?.logo_url) setLogoUrl(d.settings.logo_url)
      })
      .catch(() => {})
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Completa todos los campos')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await authAPI.login(email, password)
      const { access_token } = res.data
      localStorage.setItem('omniflow_token', access_token)
      try {
        const { default: api } = await import('@/lib/api')
        const me = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${access_token}` }
        })
        localStorage.setItem('omniflow_user', JSON.stringify(me.data))
      } catch { /* proceed anyway */ }
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Credenciales incorrectas. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotLoading(true)
    setForgotError('')
    try {
      await authAPI.forgotPassword(forgotEmail)
      setForgotDone(true)
    } catch {
      setForgotError('Error al enviar el correo. Intenta de nuevo.')
    } finally {
      setForgotLoading(false)
    }
  }

  const closeForgot = () => {
    setShowForgot(false)
    setForgotEmail('')
    setForgotDone(false)
    setForgotError('')
  }

  return (
    <div className="min-h-screen bg-[#080812] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={brandName}
                className="object-contain"
                style={{ maxHeight: 80, maxWidth: 220 }}
              />
            ) : (
              <div className="inline-flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-2xl shadow-violet-500/40">
                  <Wifi size={24} className="text-white" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
                  {brandName}
                </span>
              </div>
            )}
          </div>
          <p className="text-slate-400 text-sm">Ingresa a tu panel de control</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <h2 className="text-xl font-semibold text-white mb-6">Iniciar Sesión</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Correo electrónico</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tuempresa.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-400">Contraseña</label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25 mt-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          ¿No tienes cuenta?{' '}
          <a href="/#pricing" className="text-violet-400 hover:text-violet-300 transition-colors">
            Ver planes
          </a>
        </p>
      </div>

      {/* Forgot password modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Recuperar contraseña</h2>
              <button onClick={closeForgot} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {forgotDone ? (
              <div className="text-center py-4">
                <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
                <p className="text-white font-medium mb-1">¡Correo enviado!</p>
                <p className="text-slate-400 text-sm">Revisa tu bandeja de entrada. El enlace expira en 1 hora.</p>
                <button
                  onClick={closeForgot}
                  className="mt-5 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-sm text-slate-300 transition-all"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                <p className="text-slate-400 text-sm">Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.</p>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Correo electrónico</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@tuempresa.com"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>
                {forgotError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{forgotError}</p>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={closeForgot}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-sm text-slate-400 transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={forgotLoading}
                    className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-all disabled:opacity-50">
                    {forgotLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : 'Enviar enlace'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
