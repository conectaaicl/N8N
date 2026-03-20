'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { Wifi, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) setError('Enlace inválido. Solicita uno nuevo desde la pantalla de inicio de sesión.')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authAPI.resetPassword(token, newPassword)
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Error al restablecer la contraseña. El enlace puede haber expirado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080812] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-2xl shadow-violet-500/40">
              <Wifi size={24} className="text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
              OmniFlow
            </span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/40">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">¡Contraseña actualizada!</h2>
              <p className="text-slate-400 text-sm">Redirigiendo al inicio de sesión...</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">Nueva contraseña</h2>
              <p className="text-slate-400 text-sm mb-6">Elige una contraseña segura de al menos 8 caracteres.</p>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Nueva contraseña</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
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

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25 mt-2"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Cambiar contraseña'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          <a href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            Volver al inicio de sesión
          </a>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
