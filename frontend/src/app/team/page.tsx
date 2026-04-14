'use client'

import { useState, useEffect, useMemo } from 'react'
import { usersAPI } from '@/lib/api'
import {
  UserPlus, RefreshCw, Eye, EyeOff, X, Key, Pencil,
  CheckCircle2, AlertCircle, UserX, Users
} from 'lucide-react'

interface Role { id: number; name: string }
interface Member {
  id: number
  full_name: string
  email: string
  is_active: boolean
  is_superuser: boolean
  role_id: number | null
  role_name: string
}

const ROLE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  admin:     { bg: '#7c3aed18', text: '#a78bfa', border: '#7c3aed40' },
  agent:     { bg: '#0ea5e918', text: '#38bdf8', border: '#0ea5e940' },
  viewer:    { bg: '#64748b18', text: '#94a3b8', border: '#64748b40' },
  superadmin:{ bg: '#ef444418', text: '#f87171', border: '#ef444440' },
}

function RoleBadge({ name }: { name: string }) {
  const s = ROLE_STYLES[name] || ROLE_STYLES.viewer
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg border capitalize"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      {name}
    </span>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={isPassword && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors pr-10"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  )
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', password: '', role_id: '2', user_type: 'agente' })

  // Edit modal
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [editForm, setEditForm] = useState({ full_name: '', email: '', role_id: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // Set password modal
  const [pwdMember, setPwdMember] = useState<Member | null>(null)
  const [newPwd, setNewPwd] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdDone, setPwdDone] = useState(false)

  // Confirm deactivate
  const [confirmDeactivate, setConfirmDeactivate] = useState<Member | null>(null)
  const [deactivating, setDeactivating] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('omniflow_user') || '{}')
      if (u.id) setCurrentUserId(u.id as number)
    } catch { /* */ }
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [mr, rr] = await Promise.all([usersAPI.list(), usersAPI.listRoles()])
      setMembers(mr.data)
      setRoles(rr.data)
    } catch { /* */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = useMemo(() => {
    if (!search) return members
    const q = search.toLowerCase()
    return members.filter(m =>
      m.full_name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role_name.toLowerCase().includes(q)
    )
  }, [members, search])

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      await usersAPI.create({
        full_name: createForm.full_name,
        email: createForm.email,
        password: createForm.password,
        role_id: createForm.role_id ? Number(createForm.role_id) : null,
      })
      setShowCreate(false)
      setCreateForm({ full_name: '', email: '', password: '', role_id: '2', user_type: 'agente' })
      fetchAll()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setCreateError(msg || 'Error al crear el usuario')
    } finally { setCreating(false) }
  }

  // ── Edit ────────────────────────────────────────────────────────────────────
  const openEdit = (m: Member) => {
    setEditMember(m)
    setEditForm({ full_name: m.full_name, email: m.email, role_id: m.role_id ? String(m.role_id) : '' })
    setEditError('')
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editMember) return
    setEditError('')
    setEditSaving(true)
    try {
      await usersAPI.update(editMember.id, {
        full_name: editForm.full_name,
        email: editForm.email,
        role_id: editForm.role_id ? Number(editForm.role_id) : null,
      })
      setEditMember(null)
      fetchAll()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setEditError(msg || 'Error al guardar')
    } finally { setEditSaving(false) }
  }

  // ── Set password ─────────────────────────────────────────────────────────────
  const openPwd = (m: Member) => { setPwdMember(m); setNewPwd(''); setPwdError(''); setPwdDone(false) }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwdMember) return
    setPwdError('')
    setPwdSaving(true)
    try {
      await usersAPI.setPassword(pwdMember.id, newPwd)
      setPwdDone(true)
      setTimeout(() => setPwdMember(null), 1500)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setPwdError(msg || 'Error al cambiar contraseña')
    } finally { setPwdSaving(false) }
  }

  // ── Deactivate ───────────────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (!confirmDeactivate) return
    setDeactivating(true)
    try {
      await usersAPI.deactivate(confirmDeactivate.id)
      setConfirmDeactivate(null)
      fetchAll()
    } catch { /* */ }
    finally { setDeactivating(false) }
  }

  // ── Toggle active ─────────────────────────────────────────────────────────────
  const handleToggleActive = async (m: Member) => {
    try {
      await usersAPI.update(m.id, { is_active: !m.is_active })
      setMembers(prev => prev.map(u => u.id === m.id ? { ...u, is_active: !u.is_active } : u))
    } catch { /* */ }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Users size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Equipo</h1>
            <p className="text-slate-500 text-xs">Gestiona los usuarios y sus accesos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/8 text-slate-400 transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
            <UserPlus size={14} />
            Nuevo usuario
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d0d1a] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm font-semibold text-white">
            {filtered.length} {filtered.length === 1 ? 'usuario' : 'usuarios'}
          </span>
          <div className="relative">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="bg-white/5 border border-white/5 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40 w-44" />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white/3 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No hay usuarios todavía</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map(m => {
                  const isSelf = m.id === currentUserId
                  const initials = m.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/10 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white flex items-center gap-1.5">
                              {m.full_name}
                              {isSelf && <span className="text-[9px] bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded-full font-semibold">Tú</span>}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <RoleBadge name={m.role_name} />
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => !isSelf && handleToggleActive(m)}
                          disabled={isSelf}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            m.is_active ? 'bg-green-500' : 'bg-slate-700'
                          } ${isSelf ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={isSelf ? 'No puedes modificar tu propia cuenta' : (m.is_active ? 'Activo — clic para desactivar' : 'Inactivo — clic para activar')}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${m.is_active ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                        <div className={`text-[10px] mt-0.5 ${m.is_active ? 'text-green-400' : 'text-red-400'}`}>
                          {m.is_active ? 'Activo' : 'Inactivo'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Edit */}
                          <button onClick={() => openEdit(m)} title="Editar usuario"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-violet-500/15 text-slate-500 hover:text-violet-400 transition-all">
                            <Pencil size={13} />
                          </button>
                          {/* Set password */}
                          <button onClick={() => openPwd(m)} title="Cambiar contraseña"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/15 text-slate-500 hover:text-amber-400 transition-all">
                            <Key size={13} />
                          </button>
                          {/* Deactivate */}
                          {!isSelf && (
                            <button onClick={() => setConfirmDeactivate(m)} title="Desactivar usuario"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-all">
                              <UserX size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        <span className="font-medium text-slate-500">Roles:</span>
        {[
          { name: 'admin', desc: 'Acceso total' },
          { name: 'agent', desc: 'Conversaciones + CRM' },
          { name: 'viewer', desc: 'Solo lectura' },
        ].map(r => {
          const s = ROLE_STYLES[r.name]
          return (
            <span key={r.name} className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                style={{ background: s.bg, color: s.text, borderColor: s.border }}>{r.name}</span>
              <span>{r.desc}</span>
            </span>
          )
        })}
      </div>

      {/* ── Create user modal ──────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-violet-400" />
                <h2 className="text-base font-bold text-white">Nuevo usuario</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <Field label="Nombre completo" value={createForm.full_name} onChange={v => setCreateForm(p => ({ ...p, full_name: v }))} placeholder="Juan García" />
              <Field label="Email" value={createForm.email} onChange={v => setCreateForm(p => ({ ...p, email: v }))} placeholder="juan@empresa.com" />
              <Field label="Contraseña inicial" value={createForm.password} onChange={v => setCreateForm(p => ({ ...p, password: v }))} type="password" placeholder="Mínimo 8 caracteres" />
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Tipo de usuario</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { type: 'cliente', role_id: '3', label: 'Cliente', desc: 'Solo lectura', color: '#64748b' },
                    { type: 'agente', role_id: '2', label: 'Agente', desc: 'Conversaciones', color: '#0ea5e9' },
                    { type: 'admin', role_id: '1', label: 'Admin', desc: 'Acceso total', color: '#7c3aed' },
                  ] as const).map(opt => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setCreateForm(p => ({ ...p, user_type: opt.type, role_id: opt.role_id }))}
                      className="rounded-xl border p-2.5 text-left transition-all"
                      style={{
                        background: createForm.user_type === opt.type ? `${opt.color}20` : 'rgba(255,255,255,0.03)',
                        borderColor: createForm.user_type === opt.type ? `${opt.color}60` : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="text-xs font-semibold" style={{ color: createForm.user_type === opt.type ? opt.color : '#94a3b8' }}>{opt.label}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white/3 border border-white/6 rounded-xl px-3 py-2 text-xs text-slate-500">
                Las credenciales se enviarán automáticamente al email del usuario.
              </div>
              {createError && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  <AlertCircle size={13} /> {createError}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-sm text-slate-400 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-all disabled:opacity-50">
                  {creating ? <RefreshCw size={14} className="animate-spin mx-auto" /> : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit user modal ────────────────────────────────────────────────────── */}
      {editMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Pencil size={15} className="text-violet-400" />
                <h2 className="text-base font-bold text-white">Editar usuario</h2>
              </div>
              <button onClick={() => setEditMember(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              <Field label="Nombre completo" value={editForm.full_name} onChange={v => setEditForm(p => ({ ...p, full_name: v }))} placeholder="Juan García" />
              <Field label="Email" value={editForm.email} onChange={v => setEditForm(p => ({ ...p, email: v }))} placeholder="juan@empresa.com" />
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Rol</label>
                <select
                  value={editForm.role_id}
                  onChange={e => setEditForm(p => ({ ...p, role_id: e.target.value }))}
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="">Sin rol asignado (admin)</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                  ))}
                </select>
              </div>
              {editError && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  <AlertCircle size={13} /> {editError}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditMember(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-sm text-slate-400 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={editSaving}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-all disabled:opacity-50">
                  {editSaving ? <RefreshCw size={14} className="animate-spin mx-auto" /> : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Set password modal ─────────────────────────────────────────────────── */}
      {pwdMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Key size={15} className="text-amber-400" />
                <h2 className="text-base font-bold text-white">Cambiar contraseña</h2>
              </div>
              <button onClick={() => setPwdMember(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {pwdDone ? (
              <div className="text-center py-4">
                <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
                <p className="text-white font-medium">¡Contraseña actualizada!</p>
              </div>
            ) : (
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2.5">
                  <p className="text-xs text-amber-300/80">
                    Estableciendo nueva contraseña para <span className="font-semibold text-amber-300">{pwdMember.full_name}</span>.
                    No se necesita la contraseña actual.
                  </p>
                </div>
                <Field label="Nueva contraseña" value={newPwd} onChange={setNewPwd} type="password" placeholder="Mínimo 8 caracteres" />
                {pwdError && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                    <AlertCircle size={13} /> {pwdError}
                  </div>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPwdMember(null)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-sm text-slate-400 transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={pwdSaving || !newPwd}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-sm font-semibold text-white transition-all disabled:opacity-50">
                    {pwdSaving ? <RefreshCw size={14} className="animate-spin mx-auto" /> : 'Cambiar contraseña'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Confirm deactivate modal ───────────────────────────────────────────── */}
      {confirmDeactivate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-red-500/15">
                <UserX size={18} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Desactivar usuario</h2>
                <p className="text-xs text-slate-500 mt-0.5">{confirmDeactivate.full_name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-5">
              El usuario no podrá iniciar sesión. Puedes reactivarlo desde el toggle de estado.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeactivate(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-sm text-slate-400 transition-all">
                Cancelar
              </button>
              <button onClick={handleDeactivate} disabled={deactivating}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold text-white transition-all disabled:opacity-50">
                {deactivating ? <RefreshCw size={14} className="animate-spin mx-auto" /> : 'Desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
