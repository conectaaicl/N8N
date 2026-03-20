'use client'

import { useState, useEffect, useMemo } from 'react'
import { adminAPI } from '@/lib/api'

// ── Types ───────────────────────────────────────────────────────────────────
interface Tenant {
  id: number; name: string; subdomain: string; plan: string
  plan_price: number; sub_status: string; is_active: boolean
  created_at: string; contacts: number; conversations: number; channels: string[]
}
interface Stats {
  total_tenants: number; active_tenants: number; suspended_tenants: number
  mrr: number; arr: number; new_tenants_30d: number
  plan_distribution: Record<string, number>
}
interface FormData {
  name: string; subdomain: string; admin_email: string; password: string; responsable: string
  plan: string; telegram_chat_id: string
  wa_phone_id: string; wa_token: string
  ig_page_id: string; ig_token: string
  fb_page_id: string; fb_token: string
  system_prompt: string; ai_model: string
}

// ── Design tokens ───────────────────────────────────────────────────────────
const C = {
  base: '#0a0b0d', surface: '#111318', card: '#161a22', hover: '#1c2130',
  border: '#1f2535', borderBright: '#2a3348',
  text: '#e8edf5', textSub: '#7a8499', textMuted: '#3d4a60',
  accent: '#00e5a0', accentDim: 'rgba(0,229,160,0.1)', accentBorder: 'rgba(0,229,160,0.2)',
  danger: '#ff4d6d', dangerDim: 'rgba(255,77,109,0.12)',
  warning: '#fbbf24',
}
const FUI = "'Plus Jakarta Sans', system-ui, sans-serif"
const FMONO = "'JetBrains Mono', monospace"

const inputStyle: React.CSSProperties = {
  background: '#111318', border: '1px solid #1f2535', borderRadius: 6,
  color: '#e8edf5', fontFamily: FUI, fontSize: 13, padding: '9px 12px',
  outline: 'none', width: '100%', transition: 'border-color 0.15s',
}

const CH_COLOR: Record<string, string> = {
  whatsapp: '#25D366', instagram: '#E1306C', facebook: '#1877F2',
  webchat: '#7c3aed', tiktok: '#ffffff', email: '#6366f1',
}
const CH_DIM: Record<string, string> = {
  whatsapp: 'rgba(37,211,102,0.12)', instagram: 'rgba(225,48,108,0.12)',
  facebook: 'rgba(24,119,242,0.12)', webchat: 'rgba(124,58,237,0.12)',
  tiktok: 'rgba(255,255,255,0.06)', email: 'rgba(99,102,241,0.12)',
}
const CH_SHORT: Record<string, string> = {
  whatsapp: 'WA', instagram: 'IG', facebook: 'FB',
  webchat: 'WC', tiktok: 'TK', email: 'EM',
}
const PLAN_COLORS: Record<string, { background: string; color: string }> = {
  Enterprise: { background: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
  Pro:        { background: 'rgba(0,229,160,0.1)',   color: '#00e5a0' },
  Starter:    { background: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  Free:       { background: 'rgba(255,255,255,0.05)',color: '#7a8499' },
}

const DEFAULT_FORM: FormData = {
  name: '', subdomain: '', admin_email: '', password: '', responsable: '',
  plan: 'Starter', telegram_chat_id: '',
  wa_phone_id: '', wa_token: '', ig_page_id: '', ig_token: '',
  fb_page_id: '', fb_token: '', system_prompt: '', ai_model: 'claude-sonnet-4-20250514',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
}

// ── Subcomponents ────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, fontFamily: FMONO, color: C.textMuted, letterSpacing: '1.5px', textTransform: 'uppercase' as const, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: 'flex', alignItems: 'center', gap: 6 }}>
        {label}
        {required && <span style={{ color: C.danger }}>*</span>}
        {hint && <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted, fontFamily: FMONO, marginLeft: 'auto' }}>{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function ChannelCard({ label, color, enabled, onToggle, children }: {
  label: string; color: string; enabled: boolean; onToggle: (v: boolean) => void; children: React.ReactNode
}) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${enabled ? color + '40' : C.border}`, borderRadius: 10, padding: 14, transition: 'all 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: enabled ? color : C.textSub }}>{label}</div>
        <div onClick={() => onToggle(!enabled)} style={{ width: 36, height: 20, background: enabled ? color : C.borderBright, borderRadius: 10, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
          <div style={{ position: 'absolute', width: 14, height: 14, background: '#fff', borderRadius: '50%', top: 3, left: enabled ? 19 : 3, transition: 'left 0.2s' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: enabled ? 1 : 0.3, pointerEvents: enabled ? 'auto' : 'none' }}>
        {children}
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'form' | 'webhooks'>('list')
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<FormData>(DEFAULT_FORM)
  const [activeChannels, setActiveChannels] = useState({ wa: false, ig: false, fb: false })
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [toggling, setToggling] = useState<number | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Tenant | null>(null)

  const fetchAll = () => {
    setLoading(true)
    Promise.all([adminAPI.getTenants(), adminAPI.getStats()])
      .then(([tr, sr]) => { setTenants(tr.data); setStats(sr.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchAll() }, [])

  const setF = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }))
  const autoSlug = (name: string) => {
    setF('name', name)
    setF('subdomain', name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  const filtered = useMemo(() => {
    let list = tenants
    if (filterTab === 'active') list = list.filter(t => t.is_active)
    if (filterTab === 'inactive') list = list.filter(t => !t.is_active)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.subdomain.toLowerCase().includes(q))
    }
    return list
  }, [tenants, filterTab, search])

  const handleCreate = async () => {
    if (!form.name || !form.subdomain || !form.admin_email || !form.password) {
      setFormError('Completa los campos requeridos'); return
    }
    setCreating(true); setFormError('')
    try {
      await adminAPI.createTenant({ name: form.name, subdomain: form.subdomain, admin_email: form.admin_email, password: form.password })
      fetchAll(); setView('list'); setForm(DEFAULT_FORM); setActiveChannels({ wa: false, ig: false, fb: false })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setFormError(e?.response?.data?.detail || 'Error al crear cliente')
    } finally { setCreating(false) }
  }

  const handleToggle = async (id: number) => {
    setConfirmToggle(null); setToggling(id)
    try {
      const r = await adminAPI.toggleTenant(id)
      setTenants(prev => prev.map(t => t.id === id ? { ...t, is_active: r.data.is_active } : t))
    } catch (e) { console.error(e) }
    finally { setToggling(null) }
  }

  const wh = (subdomain: string, canal: string) =>
    `https://n8n.conectaai.cl/webhook/omniflow?tenant=${subdomain}&canal=${canal}`

  const wForm = (canal: string) => form.subdomain
    ? wh(form.subdomain, canal)
    : '— ingresa el tenant ID primero —'

  const copyUrl = (url: string) => {
    if (!url.includes('—')) navigator.clipboard.writeText(url).catch(() => {})
  }

  const goList = () => { setView('list'); setForm(DEFAULT_FORM); setFormError('') }
  const goForm = () => { setView('form'); setForm(DEFAULT_FORM); setActiveChannels({ wa: false, ig: false, fb: false }); setFormError('') }

  // Active tenants with channels (for webhooks view)
  const tenantsWithChannels = tenants.filter(t => t.channels.length > 0)

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');`}</style>

      <div style={{ fontFamily: FUI, background: C.base, minHeight: '100%', display: 'flex', flexDirection: 'column', color: C.text, position: 'relative' }}>

        {/* Grid bg */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: `linear-gradient(rgba(0,229,160,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,160,0.012) 1px,transparent 1px)`, backgroundSize: '40px 40px' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>

          {/* Topbar */}
          <div style={{ height: 56, background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {view === 'list' ? 'Gestión de Clientes' : view === 'webhooks' ? 'Webhooks Activos' : 'Nuevo cliente'}
              </div>
              <div style={{ fontSize: 11, color: C.textSub, fontFamily: FMONO, marginTop: 1 }}>osw.conectaai.cl · Panel administrador</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {stats && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.textSub, fontFamily: FMONO, marginRight: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, boxShadow: `0 0 6px ${C.accent}`, display: 'inline-block' }} />
                  {stats.active_tenants} activos · MRR ${stats.mrr}
                </div>
              )}
              {view !== 'list' && (
                <button onClick={goList} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid ${C.border}`, background: C.card, color: C.textSub, fontFamily: FUI }}>
                  ← Volver a lista
                </button>
              )}
              {view === 'list' && (<>
                <button onClick={() => setView('webhooks')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid ${C.border}`, background: C.card, color: C.textSub, fontFamily: FUI }}>
                  🔗 Webhooks
                </button>
                <button onClick={goForm} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: C.accent, color: '#000', fontFamily: FUI }}>
                  ➕ Nuevo cliente
                </button>
              </>)}
              <button onClick={fetchAll} style={{ width: 36, height: 36, borderRadius: 6, background: C.card, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSub }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={loading ? 'animate-spin' : ''}>
                  <path d="M21 12a9 9 0 11-6.219-8.56" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── LIST VIEW ── */}
            {view === 'list' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 2, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 4 }}>
                    {([
                      ['all',      `Todos (${tenants.length})`],
                      ['active',   `Activos (${tenants.filter(t => t.is_active).length})`],
                      ['inactive', `Inactivos (${tenants.filter(t => !t.is_active).length})`],
                    ] as const).map(([val, label]) => (
                      <button key={val} onClick={() => setFilterTab(val)}
                        style={{ padding: '7px 18px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: filterTab === val ? `1px solid ${C.borderBright}` : '1px solid transparent', background: filterTab === val ? C.card : 'transparent', color: filterTab === val ? C.text : C.textSub, fontFamily: FUI, transition: 'all 0.15s' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }}>
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..."
                      style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 12px 8px 30px', fontSize: 13, color: C.text, outline: 'none', fontFamily: FUI, width: 200 }} />
                  </div>
                </div>

                {loading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
                    {[...Array(4)].map((_, i) => <div key={i} style={{ height: 200, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }} className="animate-pulse" />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
                    <div style={{ fontSize: 14, color: C.textSub, marginBottom: 16 }}>No hay clientes todavía</div>
                    <button onClick={goForm} style={{ padding: '10px 20px', background: C.accent, color: '#000', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FUI }}>
                      ➕ Crear primer cliente
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
                    {filtered.map(t => {
                      const pc = PLAN_COLORS[t.plan] || PLAN_COLORS.Free
                      return (
                        <div key={t.id}
                          style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, cursor: 'default', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.borderBright; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}>

                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: t.is_active ? `linear-gradient(90deg,${C.accent},transparent)` : `linear-gradient(90deg,${C.textMuted},transparent)` }} />

                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, background: C.hover, border: `1px solid ${C.border}`, fontFamily: FMONO, color: C.accent, flexShrink: 0 }}>
                                {initials(t.name)}
                              </div>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                                <div style={{ fontSize: 10, fontFamily: FMONO, color: C.textMuted, marginTop: 2 }}>tenant: {t.subdomain} · #{t.id.toString().padStart(4, '0')}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: t.is_active ? 'rgba(0,229,160,0.1)' : C.hover, color: t.is_active ? C.accent : C.textMuted, flexShrink: 0 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                              {t.is_active ? 'Activo' : 'Inactivo'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                            {t.channels.length === 0
                              ? <span style={{ fontSize: 10, color: C.textMuted }}>Sin canales configurados</span>
                              : t.channels.map(ch => (
                                <span key={ch} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, fontFamily: FMONO, background: CH_DIM[ch] || 'rgba(255,255,255,0.05)', color: CH_COLOR[ch] || C.textSub }}>
                                  {CH_SHORT[ch] || ch.toUpperCase()} ✓
                                </span>
                              ))
                            }
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                            {[
                              { val: t.conversations.toLocaleString(), label: 'Convs. total' },
                              { val: t.contacts.toLocaleString(), label: 'Contactos' },
                              { val: new Date(t.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }), label: 'Registrado' },
                            ].map(({ val, label }) => (
                              <div key={label} style={{ background: C.surface, borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                                <div style={{ fontSize: 15, fontWeight: 800, fontFamily: FMONO, color: C.text }}>{val}</div>
                                <div style={{ fontSize: 9, color: C.textMuted, marginTop: 1 }}>{label}</div>
                              </div>
                            ))}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, fontFamily: FMONO, ...pc }}>
                              {t.plan.toUpperCase()}
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => setConfirmToggle(t)} disabled={toggling === t.id}
                                style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${C.border}`, background: C.hover, color: t.is_active ? C.danger : C.accent, borderRadius: 6, fontFamily: FUI, transition: 'all 0.15s' }}>
                                {toggling === t.id ? '...' : t.is_active ? '✕ Suspender' : '✓ Activar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── WEBHOOKS VIEW ── */}
            {view === 'webhooks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12, color: C.textSub }}>
                  URLs de webhook por tenant — entregar al cliente para configurar en Meta Developer Portal.
                </div>
                {tenantsWithChannels.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: C.textMuted }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🔗</div>
                    <div>Ningún cliente tiene canales configurados aún</div>
                  </div>
                ) : tenantsWithChannels.map(t => (
                  <div key={t.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, background: C.surface }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, background: C.hover, fontFamily: FMONO, color: C.accent }}>
                        {initials(t.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                        <div style={{ fontSize: 10, fontFamily: FMONO, color: C.textMuted }}>tenant: {t.subdomain}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                        {t.channels.map(ch => (
                          <span key={ch} style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8, fontFamily: FMONO, background: CH_DIM[ch] || 'rgba(255,255,255,0.05)', color: CH_COLOR[ch] || C.textSub }}>
                            {CH_SHORT[ch] || ch.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {t.channels.map(ch => {
                        const url = wh(t.subdomain, ch)
                        return (
                          <div key={ch} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 10, color: CH_COLOR[ch] || C.textSub, minWidth: 30, fontFamily: FMONO, fontWeight: 700 }}>{CH_SHORT[ch] || ch}</span>
                            <div style={{ fontFamily: FMONO, fontSize: 11, color: C.accent, flex: 1, wordBreak: 'break-all' as const }}>{url}</div>
                            <button onClick={() => copyUrl(url)}
                              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, color: C.textSub, cursor: 'pointer', whiteSpace: 'nowrap' as const, fontFamily: FUI, transition: 'all 0.15s' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent; (e.currentTarget as HTMLButtonElement).style.color = C.accent }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.color = C.textSub }}>
                              Copiar
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── FORM VIEW ── */}
            {view === 'form' && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>

                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>🏢 Datos del cliente</div>
                  <div style={{ fontSize: 11, fontFamily: FMONO, color: C.textMuted }}>ID generado automáticamente al guardar</div>
                </div>

                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>

                  <Section title="01 — Información básica">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Nombre empresa" required>
                        <input value={form.name} onChange={e => autoSlug(e.target.value)} placeholder="Ej: Ferretería González" style={inputStyle} />
                      </Field>
                      <Field label="Tenant ID" required hint="solo letras/números sin espacios">
                        <input value={form.subdomain} onChange={e => setF('subdomain', e.target.value)} placeholder="ferreteria" style={{ ...inputStyle, fontFamily: FMONO, fontSize: 12 }} />
                      </Field>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Email admin" required>
                        <input type="email" value={form.admin_email} onChange={e => setF('admin_email', e.target.value)} placeholder="admin@empresa.cl" style={inputStyle} />
                      </Field>
                      <Field label="Contraseña" required>
                        <input type="password" value={form.password} onChange={e => setF('password', e.target.value)} placeholder="••••••••" style={inputStyle} />
                      </Field>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Contacto responsable">
                        <input value={form.responsable} onChange={e => setF('responsable', e.target.value)} placeholder="Nombre del dueño o encargado" style={inputStyle} />
                      </Field>
                    </div>
                  </Section>

                  <Section title="02 — Plan contratado">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {[
                        { key: 'Starter',    price: 'Básico',     period: '/mes',          features: ['1 canal (WA)', '500 convs/mes', 'Bot básico', 'Alertas TG'] },
                        { key: 'Pro',        price: 'Pro',        period: '/mes',          features: ['3 canales', 'Sin límite convs', 'Bot vendedor', 'CRM básico'] },
                        { key: 'Enterprise', price: 'A convenir', period: 'personalizado', features: ['Todo Pro', 'Prompt avanzado', 'Integraciones', 'SLA garantizado'] },
                      ].map(p => (
                        <div key={p.key} onClick={() => setF('plan', p.key)}
                          style={{ background: form.plan === p.key ? C.accentDim : C.surface, border: `1px solid ${form.plan === p.key ? C.accent : C.border}`, borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' as const }}>
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{p.key}</div>
                          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: FMONO, color: C.accent }}>{p.price}</div>
                          <div style={{ fontSize: 10, color: C.textMuted }}>{p.period}</div>
                          <div style={{ marginTop: 8, fontSize: 11, color: C.textSub, lineHeight: 1.8, textAlign: 'left' as const }}>
                            {p.features.map(f => <div key={f}>✓ {f}</div>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="03 — Canales y credenciales Meta">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      <ChannelCard label="WhatsApp" color="#25D366" enabled={activeChannels.wa} onToggle={v => setActiveChannels(p => ({ ...p, wa: v }))}>
                        <input value={form.wa_phone_id} onChange={e => setF('wa_phone_id', e.target.value)} placeholder="Phone Number ID" style={{ ...inputStyle, fontSize: 11, fontFamily: FMONO }} />
                        <input type="password" value={form.wa_token} onChange={e => setF('wa_token', e.target.value)} placeholder="EAABsb..." style={{ ...inputStyle, fontSize: 11, fontFamily: FMONO }} />
                      </ChannelCard>
                      <ChannelCard label="Instagram" color="#E1306C" enabled={activeChannels.ig} onToggle={v => setActiveChannels(p => ({ ...p, ig: v }))}>
                        <input value={form.ig_page_id} onChange={e => setF('ig_page_id', e.target.value)} placeholder="Instagram Page ID" style={{ ...inputStyle, fontSize: 11, fontFamily: FMONO }} />
                        <input type="password" value={form.ig_token} onChange={e => setF('ig_token', e.target.value)} placeholder="EAABsb..." style={{ ...inputStyle, fontSize: 11, fontFamily: FMONO }} />
                      </ChannelCard>
                      <ChannelCard label="Facebook" color="#1877F2" enabled={activeChannels.fb} onToggle={v => setActiveChannels(p => ({ ...p, fb: v }))}>
                        <input value={form.fb_page_id} onChange={e => setF('fb_page_id', e.target.value)} placeholder="Facebook Page ID" style={{ ...inputStyle, fontSize: 11, fontFamily: FMONO }} />
                        <input type="password" value={form.fb_token} onChange={e => setF('fb_token', e.target.value)} placeholder="EAABsb..." style={{ ...inputStyle, fontSize: 11, fontFamily: FMONO }} />
                      </ChannelCard>
                    </div>
                  </Section>

                  <Section title="04 — URLs webhook (entregar al cliente para configurar en Meta)">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[['WA', wForm('whatsapp')], ['IG/FB', wForm('facebook')]].map(([label, url]) => (
                        <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, color: C.textMuted, minWidth: 40, fontFamily: FMONO }}>{label}</span>
                          <div style={{ fontFamily: FMONO, fontSize: 12, color: C.accent, flex: 1, wordBreak: 'break-all' as const }}>{url}</div>
                          <button onClick={() => copyUrl(url)}
                            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, color: C.textSub, cursor: 'pointer', whiteSpace: 'nowrap' as const, fontFamily: FUI }}>
                            Copiar
                          </button>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="05 — Configuración del bot IA">
                    <Field label="System prompt del negocio" required hint="define personalidad + catálogo">
                      <textarea value={form.system_prompt} onChange={e => setF('system_prompt', e.target.value)} rows={8}
                        placeholder={`Eres un asistente de ventas amigable para [NOMBRE EMPRESA].\n\nCATÁLOGO:\n- Producto 1: $XX.XXX CLP\n- Producto 2: $XX.XXX CLP\n\nCuando el cliente quiera comprar, solicita: nombre completo y email.\nSi no puedes resolver algo, responde: ESCALAR_HUMANO`}
                        style={{ ...inputStyle, minHeight: 130, resize: 'vertical', fontFamily: FMONO, fontSize: 12, lineHeight: 1.7 }} />
                      <div style={{ fontSize: 10, color: C.textMuted, fontFamily: FMONO, textAlign: 'right', marginTop: 3 }}>{form.system_prompt.length} / 2000 caracteres</div>
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Modelo IA">
                        <select value={form.ai_model} onChange={e => setF('ai_model', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                          <option value="claude-sonnet-4-20250514">claude-sonnet-4 (recomendado)</option>
                          <option value="claude-haiku-4-5-20251001">claude-haiku-4.5 (más económico)</option>
                          <option value="gpt-4o">gpt-4o</option>
                          <option value="gpt-4o-mini">gpt-4o-mini</option>
                          <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                          <option value="llama-3.3-70b-versatile">llama-3.3-70b (Groq)</option>
                        </select>
                      </Field>
                    </div>
                  </Section>

                  <Section title="06 — Notificaciones Telegram">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Chat ID Telegram del cliente" required>
                        <input value={form.telegram_chat_id} onChange={e => setF('telegram_chat_id', e.target.value)} placeholder="-100123456789" style={{ ...inputStyle, fontFamily: FMONO }} />
                      </Field>
                      <Field label="Notificar cuando">
                        <select style={{ ...inputStyle, cursor: 'pointer' }}>
                          <option>Solo escalados a humano</option>
                          <option>Escalados + ventas cerradas</option>
                          <option>Todas las conversaciones</option>
                        </select>
                      </Field>
                    </div>
                  </Section>

                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: `1px solid ${C.border}`, background: C.surface }}>
                  <div>{formError && <span style={{ fontSize: 12, color: C.danger }}>{formError}</span>}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={goList}
                      style={{ padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: C.dangerDim, color: C.danger, border: `1px solid rgba(255,77,109,0.2)`, fontFamily: FUI }}>
                      ✕ Cancelar
                    </button>
                    <button onClick={handleCreate} disabled={creating}
                      style={{ padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: creating ? 'rgba(0,229,160,0.5)' : C.accent, color: '#000', fontFamily: FUI }}>
                      {creating ? 'Creando...' : '⚡ Guardar y activar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Confirm toggle modal */}
        {confirmToggle && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, width: '100%', maxWidth: 380 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 10, borderRadius: 10, background: confirmToggle.is_active ? C.dangerDim : C.accentDim }}>
                  {confirmToggle.is_active
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={C.danger} strokeWidth="2" strokeLinecap="round"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  }
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{confirmToggle.is_active ? 'Suspender empresa' : 'Activar empresa'}</div>
                  <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>
                    {confirmToggle.name} · <span style={{ fontFamily: FMONO, color: C.accent }}>{confirmToggle.subdomain}</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: C.textSub, marginBottom: 20 }}>
                {confirmToggle.is_active ? 'Los usuarios no podrán iniciar sesión hasta que la reactives.' : 'La empresa será reactivada inmediatamente.'}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmToggle(null)} style={{ flex: 1, padding: 10, borderRadius: 6, background: C.hover, border: `1px solid ${C.border}`, fontSize: 13, color: C.textSub, cursor: 'pointer', fontFamily: FUI }}>Cancelar</button>
                <button onClick={() => handleToggle(confirmToggle.id)}
                  style={{ flex: 1, padding: 10, borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: confirmToggle.is_active ? C.danger : C.accent, color: confirmToggle.is_active ? '#fff' : '#000', fontFamily: FUI }}>
                  {confirmToggle.is_active ? 'Sí, suspender' : 'Sí, activar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
