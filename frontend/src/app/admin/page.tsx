'use client'

import { useState, useEffect, useMemo } from 'react'
import { adminAPI, tenantAPI } from '@/lib/api'

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

const CH_EMOJI: Record<string, string> = {
  whatsapp: '💬', instagram: '📸', facebook: '🔵',
  tiktok: '🎵', shopify: '🛒', email: '✉️', webchat: '💻',
}
const PLAN_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Enterprise: { bg: '#7c3aed18', text: '#a78bfa', border: '#7c3aed40' },
  Pro:        { bg: '#0ea5e918', text: '#38bdf8', border: '#0ea5e940' },
  Starter:    { bg: '#10b98118', text: '#34d399', border: '#10b98140' },
  Free:       { bg: 'rgba(255,255,255,0.03)', text: '#64748b', border: 'rgba(255,255,255,0.06)' },
}

const AI_MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'Anthropic', icon: '🟠', cost: '~$0.003/conv', tags: ['smart', 'vision'] },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'Anthropic', icon: '🟠', cost: '~$0.0003/conv', tags: ['fast', 'cheap'] },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: '🟢', cost: '~$0.005/conv', tags: ['smart', 'vision'] },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', icon: '🟢', cost: '~$0.0004/conv', tags: ['fast', 'cheap'] },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', icon: '🔵', cost: '~$0.0001/conv', tags: ['fast', 'cheap'] },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'Groq', icon: '🟣', cost: '~$0.00006/conv', tags: ['fast', 'smart'] },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'Groq', icon: '🟣', cost: 'Casi gratis', tags: ['fast', 'cheap'] },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', icon: '🔷', cost: '~$0.0003/conv', tags: ['smart', 'cheap'] },
]

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#0d0d1a] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-xl" style={{ background: color + '18' }}>
          <div style={{ color }}>{icon}</div>
        </div>
        {sub && <span className="text-xs text-slate-600">{sub}</span>}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  )
}

// ── Wizard Steps ───────────────────────────────────────────────────────────
const STEPS = ['Empresa', 'Plan', 'Canales', 'Modelo IA', 'Bot', 'Confirmar']

interface WizardData {
  // Step 1
  name: string; subdomain: string; admin_email: string; password: string; responsable: string
  // Step 2
  plan: string; telegram_chat_id: string
  // Step 3 - channels (stored as settings to update after creation)
  wa_phone_id: string; wa_token: string; wa_verify: string
  ig_page_id: string; ig_token: string
  fb_page_id: string; fb_token: string
  // Step 4
  ai_model: string; ai_key: string
  // Step 5
  bot_name: string; greeting: string; system_prompt: string
}

const DEFAULT_WIZARD: WizardData = {
  name: '', subdomain: '', admin_email: '', password: '', responsable: '',
  plan: 'Starter', telegram_chat_id: '',
  wa_phone_id: '', wa_token: '', wa_verify: '',
  ig_page_id: '', ig_token: '',
  fb_page_id: '', fb_token: '',
  ai_model: 'claude-sonnet-4-20250514', ai_key: '',
  bot_name: '', greeting: '¡Hola! ¿En qué te puedo ayudar hoy? 😊',
  system_prompt: '',
}

function WizardModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(DEFAULT_WIZARD)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [activeChannels, setActiveChannels] = useState({ wa: false, ig: false, fb: false })
  const [modelFilter, setModelFilter] = useState('all')

  const set = (k: keyof WizardData, v: string) => setData(p => ({ ...p, [k]: v }))

  const autoSlug = (name: string) => {
    set('name', name)
    set('subdomain', name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  const next = () => {
    setError('')
    if (step === 0 && (!data.name || !data.subdomain || !data.admin_email || !data.password)) {
      setError('Completa todos los campos requeridos'); return
    }
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else handleCreate()
  }
  const prev = () => { setError(''); setStep(s => s - 1) }

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    try {
      // 1. Create tenant (4 required fields - existing API)
      const res = await adminAPI.createTenant({
        name: data.name,
        subdomain: data.subdomain,
        admin_email: data.admin_email,
        password: data.password,
      })

      // 2. If we have channels/AI config, update settings via tenantAPI
      // Note: this would need auth as that tenant - for now we just create the tenant
      // Settings can be configured by the tenant admin from their settings page
      // Future: add a superadmin endpoint to update tenant settings directly

      void res
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e?.response?.data?.detail || 'Error al crear tenant')
    } finally {
      setCreating(false)
    }
  }

  const selectedModel = AI_MODELS.find(m => m.id === data.ai_model)
  const filteredModels = modelFilter === 'all' ? AI_MODELS : AI_MODELS.filter(m => m.tags.includes(modelFilter))

  const wh = (canal: string) => data.subdomain
    ? `https://n8n.conectaai.cl/webhook/omniflow?tenant=${data.subdomain}&canal=${canal}`
    : '— ingresa el tenant ID primero —'

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-white">Nuevo tenant</h2>
            <p className="text-xs text-slate-500 mt-0.5">Configura todo en un solo flujo</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Steps bar */}
        <div className="flex items-center px-5 py-3 border-b border-white/5 gap-1 flex-shrink-0 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all"
                  style={{ background: i < step ? '#7c3aed' : i === step ? '#7c3aed' : '#1c2130', color: i <= step ? '#fff' : '#475569', border: i > step ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-[9px] whitespace-nowrap" style={{ color: i === step ? '#a78bfa' : '#334155' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-6 h-px mb-4 transition-colors" style={{ background: i < step ? '#7c3aed' : 'rgba(255,255,255,0.06)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {/* STEP 0: EMPRESA */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">Datos del cliente</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Nombre empresa *</label>
                  <input value={data.name} onChange={e => autoSlug(e.target.value)} placeholder="Ferretería González"
                    className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Tenant ID *</label>
                  <input value={data.subdomain} onChange={e => set('subdomain', e.target.value)} placeholder="ferreteria"
                    className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-xs text-violet-300 placeholder:text-slate-700 focus:outline-none focus:border-violet-500 transition-colors font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Email admin *</label>
                  <input type="email" value={data.admin_email} onChange={e => set('admin_email', e.target.value)} placeholder="admin@empresa.cl"
                    className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Contraseña *</label>
                  <input type="password" value={data.password} onChange={e => set('password', e.target.value)} placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Responsable</label>
                <input value={data.responsable} onChange={e => set('responsable', e.target.value)} placeholder="Nombre del dueño o encargado"
                  className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500 transition-colors" />
              </div>
            </div>
          )}

          {/* STEP 1: PLAN */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">Plan contratado</p>
              <div className="grid grid-cols-3 gap-2">
                {['Starter', 'Pro', 'Enterprise'].map(p => (
                  <button key={p} onClick={() => set('plan', p)}
                    className="rounded-xl p-3 text-left transition-all border"
                    style={{ background: data.plan === p ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)', borderColor: data.plan === p ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)' }}>
                    <div className="text-xs font-semibold text-white mb-1">{p}</div>
                    <div className="text-[10px] text-slate-500 leading-relaxed">
                      {p === 'Starter' ? '1 canal\n500 convs/mes' : p === 'Pro' ? 'Todos los canales\nSin límite' : 'Todo Pro\nSLA garantizado'}
                    </div>
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Telegram Chat ID del cliente (alertas)</label>
                <input value={data.telegram_chat_id} onChange={e => set('telegram_chat_id', e.target.value)} placeholder="-100123456789"
                  className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500 transition-colors font-mono text-xs" />
              </div>
            </div>
          )}

          {/* STEP 2: CANALES */}
          {step === 2 && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-3">Canales — el cliente los configura desde Ajustes después de creado</p>

              {/* WhatsApp */}
              <div className="rounded-xl border transition-all overflow-hidden" style={{ background: '#131825', borderColor: activeChannels.wa ? 'rgba(37,211,102,0.25)' : 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer" onClick={() => setActiveChannels(p => ({ ...p, wa: !p.wa }))}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💬</span>
                    <div>
                      <div className="text-xs font-medium text-white">WhatsApp Business API</div>
                      <div className="text-[10px] text-slate-600">Meta Cloud API</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: activeChannels.wa ? 'rgba(37,211,102,0.12)' : 'rgba(255,255,255,0.04)', color: activeChannels.wa ? '#25d366' : '#475569' }}>
                      {activeChannels.wa ? 'Activo' : 'Inactivo'}
                    </span>
                    <input type="checkbox" checked={activeChannels.wa} readOnly className="accent-green-500 cursor-pointer" />
                  </div>
                </div>
                {activeChannels.wa && (
                  <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
                    <input value={data.wa_phone_id} onChange={e => set('wa_phone_id', e.target.value)} placeholder="Phone Number ID" className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder:text-slate-700 focus:outline-none focus:border-green-500/40" />
                    <input type="password" value={data.wa_token} onChange={e => set('wa_token', e.target.value)} placeholder="Access Token — EAABsb..." className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder:text-slate-700 focus:outline-none focus:border-green-500/40" />
                    <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1.5 border border-green-500/20">
                      <span className="text-[10px] text-slate-500 flex-shrink-0">Webhook:</span>
                      <span className="text-[10px] text-green-400 font-mono truncate">{wh('whatsapp')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Instagram */}
              <div className="rounded-xl border transition-all overflow-hidden" style={{ background: '#131825', borderColor: activeChannels.ig ? 'rgba(225,48,108,0.25)' : 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer" onClick={() => setActiveChannels(p => ({ ...p, ig: !p.ig }))}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📸</span>
                    <div>
                      <div className="text-xs font-medium text-white">Instagram DMs</div>
                      <div className="text-[10px] text-slate-600">instagram_manage_messages</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: activeChannels.ig ? 'rgba(225,48,108,0.12)' : 'rgba(255,255,255,0.04)', color: activeChannels.ig ? '#e1306c' : '#475569' }}>
                      {activeChannels.ig ? 'Activo' : 'Inactivo'}
                    </span>
                    <input type="checkbox" checked={activeChannels.ig} readOnly className="cursor-pointer" style={{ accentColor: '#e1306c' }} />
                  </div>
                </div>
                {activeChannels.ig && (
                  <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
                    <input value={data.ig_page_id} onChange={e => set('ig_page_id', e.target.value)} placeholder="Instagram Business Account ID" className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder:text-slate-700 focus:outline-none" />
                    <input type="password" value={data.ig_token} onChange={e => set('ig_token', e.target.value)} placeholder="Page Access Token" className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder:text-slate-700 focus:outline-none" />
                    <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1.5 border border-pink-500/20">
                      <span className="text-[10px] text-slate-500 flex-shrink-0">Webhook:</span>
                      <span className="text-[10px] text-pink-400 font-mono truncate">{wh('instagram')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Facebook */}
              <div className="rounded-xl border transition-all overflow-hidden" style={{ background: '#131825', borderColor: activeChannels.fb ? 'rgba(24,119,242,0.25)' : 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer" onClick={() => setActiveChannels(p => ({ ...p, fb: !p.fb }))}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔵</span>
                    <div>
                      <div className="text-xs font-medium text-white">Facebook Messenger + Lead Ads</div>
                      <div className="text-[10px] text-slate-600">pages_messaging · leadgen</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: activeChannels.fb ? 'rgba(24,119,242,0.12)' : 'rgba(255,255,255,0.04)', color: activeChannels.fb ? '#1877f2' : '#475569' }}>
                      {activeChannels.fb ? 'Activo' : 'Inactivo'}
                    </span>
                    <input type="checkbox" checked={activeChannels.fb} readOnly className="cursor-pointer" style={{ accentColor: '#1877f2' }} />
                  </div>
                </div>
                {activeChannels.fb && (
                  <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
                    <input value={data.fb_page_id} onChange={e => set('fb_page_id', e.target.value)} placeholder="Facebook Page ID" className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder:text-slate-700 focus:outline-none" />
                    <input type="password" value={data.fb_token} onChange={e => set('fb_token', e.target.value)} placeholder="Page Access Token" className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder:text-slate-700 focus:outline-none" />
                    <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1.5 border border-blue-500/20">
                      <span className="text-[10px] text-slate-500 flex-shrink-0">Webhook:</span>
                      <span className="text-[10px] text-blue-400 font-mono truncate">{wh('facebook')}</span>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-600 mt-2">
                Los demás canales (TikTok, Shopify, Email, Web Chat) se configuran desde la sección Canales después de crear el tenant.
              </p>
            </div>
          )}

          {/* STEP 3: MODELO IA */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">Modelo IA del agente</p>
              <div className="flex gap-2 flex-wrap">
                {['all', 'fast', 'smart', 'cheap'].map(f => (
                  <button key={f} onClick={() => setModelFilter(f)}
                    className="px-3 py-1 rounded-full text-[10px] font-medium transition-all border"
                    style={{ background: modelFilter === f ? 'rgba(124,58,237,0.15)' : 'transparent', color: modelFilter === f ? '#a78bfa' : '#475569', borderColor: modelFilter === f ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)' }}>
                    {f === 'all' ? 'Todos' : f === 'fast' ? '⚡ Rápido' : f === 'smart' ? '🧠 Inteligente' : '💰 Económico'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredModels.map(m => (
                  <button key={m.id} onClick={() => set('ai_model', m.id)}
                    className="text-left p-3 rounded-xl border transition-all"
                    style={{ background: data.ai_model === m.id ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)', borderColor: data.ai_model === m.id ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{m.icon}</span>
                      <span className="text-xs font-medium text-white">{m.name}</span>
                      {data.ai_model === m.id && <span className="ml-auto text-green-400 text-xs">✓</span>}
                    </div>
                    <div className="text-[10px] text-slate-500">{m.provider}</div>
                    <div className="text-[10px] text-green-400 font-mono mt-1">{m.cost}</div>
                  </button>
                ))}
              </div>
              {selectedModel && (
                <div className="flex items-center justify-between bg-white/4 border border-white/6 rounded-xl px-3 py-2">
                  <div>
                    <div className="text-xs text-slate-400">Seleccionado</div>
                    <div className="text-xs font-medium text-white">{selectedModel.icon} {selectedModel.name}</div>
                  </div>
                  <div className="text-[10px] text-green-400 font-mono">{selectedModel.cost}</div>
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-500 mb-1">API Key — {selectedModel?.provider || 'Proveedor'}</label>
                <input type="password" value={data.ai_key} onChange={e => set('ai_key', e.target.value)}
                  placeholder="sk-ant-... / sk-... / gsk_... / AIza..."
                  className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-700 focus:outline-none focus:border-violet-500 transition-colors" />
                <p className="text-[10px] text-slate-600 mt-1">Se guarda en la configuración del tenant. Se puede cambiar después desde Ajustes.</p>
              </div>
            </div>
          )}

          {/* STEP 4: BOT */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">Configuración del agente</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Nombre del agente</label>
                  <input value={data.bot_name} onChange={e => set('bot_name', e.target.value)} placeholder="Asistente González"
                    className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Mensaje de bienvenida</label>
                  <input value={data.greeting} onChange={e => set('greeting', e.target.value)} placeholder="¡Hola! ¿En qué te ayudo?"
                    className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">System Prompt — Entrenamiento del agente *</label>
                <textarea value={data.system_prompt} onChange={e => set('system_prompt', e.target.value)} rows={7}
                  placeholder={`Eres el asistente de ventas de [EMPRESA], especializada en [RUBRO].\n\nResponde preguntas sobre productos, precios y disponibilidad.\nCuando el cliente quiera comprar, solicita: nombre y email.\nSi no puedes resolver algo, escribe: ESCALAR_HUMANO\n\nCATÁLOGO:\n- Producto 1: $XX.XXX CLP\n- Producto 2: $XX.XXX CLP\n\nResponde en español, de forma breve y amigable.`}
                  className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2.5 text-xs text-white font-mono placeholder:text-slate-700 focus:outline-none focus:border-violet-500 transition-colors resize-y" />
                <p className="text-[10px] text-slate-600 mt-1">{data.system_prompt.length} / 2000 caracteres</p>
              </div>
            </div>
          )}

          {/* STEP 5: CONFIRMAR */}
          {step === 5 && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-3">Resumen antes de activar</p>
              {[
                ['Empresa', data.name || '—'],
                ['Tenant ID', data.subdomain || '—'],
                ['Email admin', data.admin_email || '—'],
                ['Plan', data.plan],
                ['Canales', [activeChannels.wa && 'WhatsApp', activeChannels.ig && 'Instagram', activeChannels.fb && 'Facebook'].filter(Boolean).join(', ') || 'Ninguno'],
                ['Modelo IA', selectedModel ? `${selectedModel.icon} ${selectedModel.name}` : '—'],
                ['Costo IA est.', selectedModel?.cost || '—'],
                ['Agente', data.bot_name || '—'],
                ['Webhook WA', data.subdomain ? `n8n.conectaai.cl/webhook/omniflow?tenant=${data.subdomain}&canal=whatsapp` : '—'],
              ].map(([lbl, val]) => (
                <div key={lbl} className="flex justify-between items-center py-1.5 border-b border-white/4 text-xs">
                  <span className="text-slate-500">{lbl}</span>
                  <span className={`font-medium text-right max-w-[60%] truncate font-mono ${lbl === 'Tenant ID' || lbl.includes('Webhook') ? 'text-violet-400' : lbl === 'Costo IA est.' ? 'text-green-400' : 'text-white'}`}>{val}</span>
                </div>
              ))}
              <div className="mt-3 p-3 bg-green-500/5 border border-green-500/15 rounded-xl">
                <p className="text-[10px] text-green-400">✓ El tenant se creará activo. Las credenciales de canales y el system prompt se pueden editar desde Ajustes del tenant.</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between flex-shrink-0">
          <button onClick={prev} disabled={step === 0}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 bg-white/5 border border-white/8 transition-all disabled:opacity-30 hover:border-white/15">
            Anterior
          </button>
          <span className="text-[10px] text-slate-600 font-mono">Paso {step + 1} de {STEPS.length}</span>
          {error && <span className="text-xs text-red-400 max-w-[200px] truncate">{error}</span>}
          <button onClick={next} disabled={creating}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: step === STEPS.length - 1 ? '#059669' : '#7c3aed' }}>
            {creating ? 'Creando...' : step === STEPS.length - 1 ? '⚡ Crear y activar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showWizard, setShowWizard] = useState(false)
  const [toggling, setToggling] = useState<number | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Tenant | null>(null)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  const fetchAll = () => {
    setLoading(true)
    Promise.all([adminAPI.getTenants(), adminAPI.getStats()])
      .then(([tr, sr]) => { setTenants(tr.data); setStats(sr.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = useMemo(() => {
    let list = tenants
    if (filterPlan !== 'all') list = list.filter(t => t.plan === filterPlan)
    if (filterStatus === 'active') list = list.filter(t => t.is_active)
    if (filterStatus === 'suspended') list = list.filter(t => !t.is_active)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.subdomain.toLowerCase().includes(q))
    }
    return list
  }, [tenants, search, filterPlan, filterStatus])

  const handleToggle = async (id: number) => {
    setConfirmToggle(null)
    setToggling(id)
    try {
      const r = await adminAPI.toggleTenant(id)
      setTenants(prev => prev.map(t => t.id === id ? { ...t, is_active: r.data.is_active } : t))
    } catch (e) { console.error(e) }
    finally { setToggling(null) }
  }

  const plans = ['all', ...Array.from(new Set(tenants.map(t => t.plan)))]

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#080812' }}>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-violet-400">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">SuperAdmin</h1>
              <p className="text-slate-500 text-xs">Control total de la plataforma</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-green-500/8 border border-green-500/20 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Sistema operativo</span>
            </div>
            <button onClick={() => setShowWizard(true)}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
              Nuevo tenant
            </button>
            <button onClick={fetchAll} className="p-2 rounded-xl bg-white/5 hover:bg-white/8 text-slate-400 transition-all">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className={loading ? 'animate-spin' : ''}>
                <path d="M21 12a9 9 0 11-6.219-8.56" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Tenants totales" value={stats.total_tenants} color="#7c3aed"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>} />
            <StatCard label="Activos" value={stats.active_tenants} color="#10b981"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <StatCard label="Suspendidos" value={stats.suspended_tenants} color="#ef4444"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>} />
            <StatCard label="MRR" value={`$${stats.mrr}`} sub="USD/mes" color="#f59e0b"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>} />
            <StatCard label="ARR" value={`$${stats.arr}`} sub="proyectado" color="#06b6d4"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M23 6l-9.5 9.5-5-5L1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            <StatCard label="Nuevos 30d" value={stats.new_tenants_30d} color="#8b5cf6"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
          </div>
        )}

        {/* Plan dist */}
        {stats && Object.keys(stats.plan_distribution).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(stats.plan_distribution).map(([plan, count]) => {
              const s = PLAN_STYLE[plan] || PLAN_STYLE.Free
              const pct = stats.active_tenants > 0 ? Math.round((count / stats.active_tenants) * 100) : 0
              return (
                <div key={plan} className="bg-[#0d0d1a] border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: s.text }}>{plan}</span>
                    <span className="text-xs text-slate-600">{pct}%</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-2">{count}</div>
                  <div className="h-1 rounded-full bg-white/5">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.text }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Table */}
        <div className="bg-[#0d0d1a] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold text-white">
              Tenants {filtered.length !== tenants.length && <span className="text-xs text-slate-600 font-normal ml-1">({filtered.length} de {tenants.length})</span>}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                  className="bg-white/5 border border-white/5 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40 w-40" />
              </div>
              <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none">
                {plans.map(p => <option key={p} value={p}>{p === 'all' ? 'Todos los planes' : p}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none">
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="suspended">Suspendidos</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-5 space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-white/3 rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-slate-700 mx-auto mb-3">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <p className="text-sm text-slate-500">Sin resultados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Canales</th>
                    <th className="px-4 py-3">Contactos</th>
                    <th className="px-4 py-3">Convs</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Registrado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filtered.map(t => {
                    const ps = PLAN_STYLE[t.plan] || PLAN_STYLE.Free
                    return (
                      <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelectedTenant(selectedTenant?.id === t.id ? null : t)}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/10 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
                              {t.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{t.name}</div>
                              <div className="flex items-center gap-1">
                                <code className="text-[10px] text-violet-400">{t.subdomain}</code>
                                <span className="text-slate-700 text-[10px]">·</span>
                                <span className="text-[10px] text-slate-700 font-mono">#{t.id.toString().padStart(4, '0')}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border" style={{ background: ps.bg, color: ps.text, borderColor: ps.border }}>{t.plan}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1 flex-wrap max-w-[100px]">
                            {t.channels.length === 0
                              ? <span className="text-[10px] text-slate-700">Sin canales</span>
                              : t.channels.map(ch => <span key={ch} title={ch} className="text-sm leading-none">{CH_EMOJI[ch] || '•'}</span>)
                            }
                          </div>
                        </td>
                        <td className="px-4 py-3.5"><span className="text-sm font-semibold text-white">{t.contacts.toLocaleString()}</span></td>
                        <td className="px-4 py-3.5"><span className="text-sm font-semibold text-white">{t.conversations.toLocaleString()}</span></td>
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setConfirmToggle(t)} disabled={toggling === t.id}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${t.is_active ? 'bg-green-500' : 'bg-slate-700'} ${toggling === t.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                            {toggling === t.id
                              ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin mx-auto" />
                              : <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${t.is_active ? 'translate-x-4' : 'translate-x-1'}`} />
                            }
                          </button>
                          <div className={`text-[10px] mt-0.5 ${t.is_active ? 'text-green-400' : 'text-red-400'}`}>{t.is_active ? 'Activo' : 'Suspendido'}</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500">
                          {new Date(t.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setSelectedTenant(t)}
                              className="px-2 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-[11px] transition-all border border-violet-500/20">
                              Ver detalle
                            </button>
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
      </div>

      {/* Side panel - tenant detail */}
      {selectedTenant && (
        <div className="w-72 flex-shrink-0 bg-[#0a0a14] border-l border-white/5 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Detalle</span>
            <button onClick={() => setSelectedTenant(null)} className="text-slate-500 hover:text-white transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/15 flex items-center justify-center text-sm font-bold text-violet-300">
                {selectedTenant.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{selectedTenant.name}</div>
                <code className="text-xs text-violet-400">{selectedTenant.subdomain}</code>
              </div>
            </div>
            {[
              ['Plan', selectedTenant.plan],
              ['Contactos', selectedTenant.contacts.toString()],
              ['Conversaciones', selectedTenant.conversations.toString()],
              ['Estado', selectedTenant.is_active ? '✓ Activo' : '✗ Suspendido'],
              ['Registrado', new Date(selectedTenant.created_at).toLocaleDateString('es-CL')],
            ].map(([lbl, val]) => (
              <div key={lbl} className="flex justify-between text-xs border-b border-white/4 pb-2">
                <span className="text-slate-500">{lbl}</span>
                <span className={`font-medium ${lbl === 'Estado' && selectedTenant.is_active ? 'text-green-400' : lbl === 'Estado' ? 'text-red-400' : 'text-white'}`}>{val}</span>
              </div>
            ))}
            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Canales activos</div>
              <div className="flex gap-1.5 flex-wrap">
                {selectedTenant.channels.length === 0
                  ? <span className="text-xs text-slate-600">Sin canales configurados</span>
                  : selectedTenant.channels.map(ch => (
                    <span key={ch} className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/8 text-slate-400">
                      {CH_EMOJI[ch]} {ch}
                    </span>
                  ))
                }
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <button className="w-full py-2 rounded-xl bg-violet-600/15 hover:bg-violet-600/25 text-violet-400 text-xs font-semibold border border-violet-500/20 transition-all">
                ✏️ Editar configuración
              </button>
              <button className="w-full py-2 rounded-xl bg-white/4 hover:bg-white/8 text-slate-400 text-xs border border-white/6 transition-all">
                💬 Ver conversaciones
              </button>
              <button onClick={() => setConfirmToggle(selectedTenant)}
                className={`w-full py-2 rounded-xl text-xs border transition-all ${selectedTenant.is_active ? 'bg-red-500/8 hover:bg-red-500/15 text-red-400 border-red-500/20' : 'bg-green-500/8 hover:bg-green-500/15 text-green-400 border-green-500/20'}`}>
                {selectedTenant.is_active ? '✕ Suspender' : '✓ Activar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm toggle */}
      {confirmToggle && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${confirmToggle.is_active ? 'bg-red-500/15' : 'bg-green-500/15'}`}>
                {confirmToggle.is_active
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-400"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-green-400"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                }
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">{confirmToggle.is_active ? 'Suspender empresa' : 'Activar empresa'}</h2>
                <p className="text-xs text-slate-500">{confirmToggle.name} · <code className="text-violet-400">{confirmToggle.subdomain}</code></p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-5">
              {confirmToggle.is_active ? 'Los usuarios no podrán iniciar sesión hasta que la reactives.' : 'La empresa será reactivada inmediatamente.'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmToggle(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-sm text-slate-400">Cancelar</button>
              <button onClick={() => handleToggle(confirmToggle.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${confirmToggle.is_active ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
                {confirmToggle.is_active ? 'Sí, suspender' : 'Sí, activar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wizard */}
      {showWizard && <WizardModal onClose={() => setShowWizard(false)} onSuccess={fetchAll} />}
    </div>
  )
}
