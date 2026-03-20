'use client'

import { useState, useEffect } from 'react'
import { tenantAPI } from '@/lib/api'

/* ── Design tokens ── */
const C = {
  base: '#0a0b0d', card: '#161a22', surface: '#111318',
  border: 'rgba(255,255,255,0.07)', accent: '#00e5a0',
  text: '#e2e8f0', muted: '#64748b',
}

const BACKEND_HOST = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://osw.conectaai.cl'

/* ── Mini components ── */
function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{children}</p>
}

function Input({ value, onChange, placeholder, secret = false, mono = false, readonly = false }: {
  value: string; onChange?: (v: string) => void
  placeholder?: string; secret?: boolean; mono?: boolean; readonly?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        readOnly={readonly}
        type={secret && !show ? 'password' : 'text'}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#0d1017', border: `1px solid ${C.border}`,
          borderRadius: 8, padding: secret ? '9px 36px 9px 12px' : '9px 12px',
          fontSize: mono ? 12 : 13, fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
          color: readonly ? C.muted : C.text,
          outline: 'none', transition: 'border-color .15s',
        }}
        onFocus={e => (e.target.style.borderColor = `${C.accent}50`)}
        onBlur={e => (e.target.style.borderColor = C.border)}
      />
      {secret && (
        <button type="button" onClick={() => setShow(s => !s)} style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 2,
        }}>
          {show
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          }
        </button>
      )}
    </div>
  )
}

function CopyRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const [copied, setCopied] = useState(false)
  const color = accent || C.accent
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#0d1017', border: `1px solid ${color}25`, borderRadius: 8, padding: '8px 12px' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? C.accent : C.muted, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, flexShrink: 0 }}>
          {copied
            ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Copiado</>
            : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copiar</>
          }
        </button>
      </div>
    </div>
  )
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: ok ? '#00e5a012' : '#64748b12', color: ok ? C.accent : C.muted, border: `1px solid ${ok ? '#00e5a030' : '#64748b20'}` }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: ok ? C.accent : C.muted }} />
      {ok ? 'Conectado' : 'Sin configurar'}
    </div>
  )
}

function Steps({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((text, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${C.accent}15`, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: C.accent, marginTop: 1 }}>{i + 1}</div>
          <p style={{ fontSize: 12, color: C.text, lineHeight: 1.5, margin: 0 }} dangerouslySetInnerHTML={{ __html: text }} />
        </div>
      ))}
    </div>
  )
}

function SaveBtn({ onClick, saving, saved, color }: { onClick: () => void; saving: boolean; saved: boolean; color: string }) {
  return (
    <button onClick={onClick} disabled={saving} style={{
      display: 'flex', alignItems: 'center', gap: 7,
      background: saving || saved ? `${color}20` : `${color}15`,
      border: `1px solid ${color}35`, color, fontWeight: 600, fontSize: 13,
      padding: '9px 20px', borderRadius: 9, cursor: saving ? 'wait' : 'pointer', transition: 'all .15s',
    }}>
      {saving
        ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>Guardando...</>
        : saved
        ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>¡Guardado!</>
        : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Guardar configuración</>
      }
    </button>
  )
}

/* ── Channel card wrapper ── */
function ChannelCard({ title, icon, color, connected, children }: {
  title: string; icon: React.ReactNode; color: string; connected: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: C.card, border: `1px solid ${connected ? color + '30' : C.border}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color .2s' }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, color: '#fff', fontSize: 14, margin: 0 }}>{title}</p>
        </div>
        <StatusBadge ok={connected} />
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '20px 20px 24px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function IntegrationsPage() {
  const [s, setS] = useState<Record<string, string | boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [testPhone, setTestPhone] = useState('')
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [testLoading, setTestLoading] = useState(false)

  useEffect(() => {
    tenantAPI.getSettings()
      .then(r => setS(r.data || {}))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const set = (k: string, v: string | boolean) => setS(p => ({ ...p, [k]: v }))
  const str = (k: string) => String(s[k] || '')
  const bool = (k: string) => Boolean(s[k])

  const save = async (section: string, fields: string[]) => {
    setSaving(section); setSaved(null)
    try {
      const data: Record<string, string | boolean> = {}
      fields.forEach(f => { if (s[f] !== undefined) data[f] = s[f] })
      await tenantAPI.updateSettings(data)
      setSaved(section)
      setTimeout(() => setSaved(null), 3000)
    } catch (e) { console.error(e) }
    finally { setSaving(null) }
  }

  const testWhatsApp = async () => {
    if (!testPhone) return
    setTestLoading(true); setTestResult(null)
    try {
      const token = localStorage.getItem('omniflow_token')
      const r = await fetch('/api/v1/tenants/test-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ to: testPhone }),
      })
      const data = await r.json()
      if (data.ok) setTestResult({ ok: true, msg: `✓ Mensaje enviado (ID: ${data.message_id})` })
      else setTestResult({ ok: false, msg: `✗ Error: ${JSON.stringify(data.error)}` })
    } catch (e) { setTestResult({ ok: false, msg: `✗ ${String(e)}` }) }
    finally { setTestLoading(false) }
  }

  if (loading) return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ height: 70, background: C.card, borderRadius: 14, animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  )

  return (
    <div style={{ background: C.base, minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
        input::placeholder { color: #374151; }
      `}</style>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Canales e Integraciones</h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 5 }}>Conecta tus redes sociales — configura una vez y funciona permanentemente</p>
        </div>

        {/* Info banner */}
        <div style={{ background: `${C.accent}08`, border: `1px solid ${C.accent}25`, borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7 }}>
            <strong style={{ color: C.accent }}>Cómo funciona:</strong> Cada vez que alguien te escribe por WhatsApp, Instagram, Facebook u otro canal, el mensaje llega a OmniFlow automáticamente, se guarda en el CRM y puede disparar una respuesta automática en n8n. Configura cada canal una sola vez.
          </div>
        </div>

        {/* ── WHATSAPP ── */}
        <ChannelCard title="WhatsApp Business API" color="#25d366" connected={bool('has_whatsapp')} icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a11.726 11.726 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.122 1.523 5.855L.057 23.5l5.775-1.507A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.893 0-3.668-.516-5.19-1.416l-.37-.221-3.43.895.92-3.341-.242-.384A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
        }>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Guide */}
            <div style={{ background: '#0d1017', borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#25d366', marginBottom: 10 }}>📋 Guía de configuración</p>
              <Steps items={[
                'Ve a <a href="https://developers.facebook.com" target="_blank" style="color:#25d366">developers.facebook.com</a> → tu App → WhatsApp → Configuración de API',
                'Copia el <strong>Phone Number ID</strong> y pégalo abajo',
                'Copia el <strong>Temporary access token</strong> (o genera uno permanente) y pégalo abajo',
                'Define un <strong>Verify Token</strong> — cualquier texto que tú elijas (ej: <code style="background:#ffffff15;padding:1px 5px;border-radius:3px">omniflow2024</code>)',
                'En WhatsApp → Webhooks, copia la URL de abajo y configúrala junto a tu Verify Token',
                'Suscríbete al campo <strong>messages</strong> — ¡listo!',
              ]} />
            </div>
            {/* Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Label>Phone Number ID</Label>
                <Input value={str('whatsapp_phone_id')} onChange={v => set('whatsapp_phone_id', v)} placeholder="123456789012345" mono />
              </div>
              <div>
                <Label>Número WhatsApp (con código país)</Label>
                <Input value={str('whatsapp_number')} onChange={v => set('whatsapp_number', v)} placeholder="+56912345678" mono />
              </div>
            </div>
            <div>
              <Label>Access Token</Label>
              <Input value={str('whatsapp_access_token')} onChange={v => set('whatsapp_access_token', v)} placeholder="EAAxxxxx..." secret mono />
            </div>
            <div>
              <Label>Verify Token (el que tú defines)</Label>
              <Input value={str('whatsapp_verify_token')} onChange={v => set('whatsapp_verify_token', v)} placeholder="omniflow2024" mono />
            </div>
            <CopyRow label="URL Webhook → pegar en Meta Developers" value={`${BACKEND_HOST}/api/v1/webhooks/whatsapp`} accent="#25d366" />

            {/* Auto-reply via n8n */}
            <div style={{ background: '#0d1017', border: `1px solid #25d36620`, borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#25d366', marginBottom: 10 }}>⚡ Respuestas automáticas con n8n</p>
              <Steps items={[
                'En n8n, crea un workflow con un nodo <strong>Webhook (POST)</strong> — path: <code style="background:#ffffff15;padding:1px 5px;border-radius:3px">whatsapp-reply</code>',
                'Conecta al nodo <strong>HTTP Request</strong> que llame a <code style="background:#ffffff15;padding:1px 5px;border-radius:3px">https://graph.facebook.com/v19.0/{phone_id}/messages</code>',
                'En el body del HTTP Request usa <code style="background:#ffffff15;padding:1px 5px;border-radius:3px">{{$json.contact.phone}}</code> como destinatario',
                'Guarda el workflow como activo, luego copia la URL del webhook y pégala en los campos de n8n abajo',
              ]} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Label>n8n URL base</Label>
                <Input value={str('n8n_url') || 'https://n8n.conectaai.cl'} onChange={v => set('n8n_url', v)} placeholder="https://n8n.conectaai.cl" mono />
              </div>
              <div>
                <Label>n8n Webhook path (para auto-reply)</Label>
                <Input value={str('n8n_webhook_path')} onChange={v => set('n8n_webhook_path', v)} placeholder="webhook/whatsapp-reply" mono />
              </div>
            </div>

            {/* Test send */}
            <div style={{ background: '#0d1017', borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#25d366', marginBottom: 10 }}>🧪 Prueba de conexión — enviar mensaje de test</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={testPhone} onChange={e => setTestPhone(e.target.value)}
                  placeholder="+56912345678"
                  style={{ flex: 1, background: '#080a0e', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.text, outline: 'none' }}
                />
                <button onClick={testWhatsApp} disabled={testLoading || !testPhone} style={{
                  background: '#25d36620', border: '1px solid #25d36640', color: '#25d366',
                  fontWeight: 600, fontSize: 12, padding: '8px 16px', borderRadius: 8,
                  cursor: testLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                }}>
                  {testLoading
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  }
                  Enviar test
                </button>
              </div>
              {testResult && (
                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 7, background: testResult.ok ? '#00e5a010' : '#ef444410', border: `1px solid ${testResult.ok ? '#00e5a030' : '#ef444430'}`, fontSize: 12, color: testResult.ok ? C.accent : '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}>
                  {testResult.msg}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <SaveBtn onClick={() => save('wa', ['whatsapp_phone_id', 'whatsapp_access_token', 'whatsapp_verify_token', 'whatsapp_number', 'n8n_url', 'n8n_webhook_path'])} saving={saving === 'wa'} saved={saved === 'wa'} color="#25d366" />
            </div>
          </div>
        </ChannelCard>

        {/* ── INSTAGRAM ── */}
        <ChannelCard title="Instagram DMs" color="#e1306c" connected={bool('has_instagram')} icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        }>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#0d1017', borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#e1306c', marginBottom: 10 }}>📋 Guía de configuración</p>
              <Steps items={[
                'Tu cuenta de Instagram debe ser <strong>Business o Creator</strong> y estar vinculada a una Página de Facebook',
                'En <a href="https://developers.facebook.com" target="_blank" style="color:#e1306c">developers.facebook.com</a> → tu App → Instagram → Configuración básica',
                'Copia el <strong>Instagram Business Account ID</strong>',
                'Genera un <strong>Page Access Token</strong> con permisos: <code style="background:#ffffff15;padding:1px 5px;border-radius:3px">instagram_basic, instagram_manage_messages</code>',
                'Define un Verify Token y configura el webhook abajo',
                'Suscríbete a: <strong>messages, messaging_seen</strong>',
              ]} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Label>Instagram Business Account ID</Label>
                <Input value={str('instagram_page_id')} onChange={v => set('instagram_page_id', v)} placeholder="123456789" mono />
              </div>
              <div>
                <Label>Verify Token</Label>
                <Input value={str('instagram_verify_token')} onChange={v => set('instagram_verify_token', v)} placeholder="omniflow_ig_2024" mono />
              </div>
            </div>
            <div>
              <Label>Page Access Token</Label>
              <Input value={str('instagram_access_token')} onChange={v => set('instagram_access_token', v)} placeholder="EAAxxxxx..." secret mono />
            </div>
            <CopyRow label="URL Webhook → pegar en Meta Developers" value={`${BACKEND_HOST}/api/v1/webhooks/meta`} accent="#e1306c" />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <SaveBtn onClick={() => save('ig', ['instagram_page_id', 'instagram_access_token', 'instagram_verify_token'])} saving={saving === 'ig'} saved={saved === 'ig'} color="#e1306c" />
            </div>
          </div>
        </ChannelCard>

        {/* ── FACEBOOK ── */}
        <ChannelCard title="Facebook Messenger + Lead Ads" color="#1877f2" connected={bool('has_facebook')} icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        }>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#0d1017', borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#1877f2', marginBottom: 10 }}>📋 Guía de configuración</p>
              <Steps items={[
                'En <a href="https://developers.facebook.com" target="_blank" style="color:#1877f2">developers.facebook.com</a> → tu App → Messenger → Configuración',
                'Conecta tu <strong>Página de Facebook</strong> y copia el <strong>Page ID</strong>',
                'Genera un <strong>Page Access Token</strong> con permisos: <code style="background:#ffffff15;padding:1px 5px;border-radius:3px">pages_messaging, leads_retrieval</code>',
                'Para Lead Ads: suscríbete también a <strong>leadgen</strong> en los webhooks',
                'Suscríbete a: <strong>messages, messaging_postbacks, leadgen</strong>',
              ]} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Label>Facebook Page ID</Label>
                <Input value={str('facebook_page_id')} onChange={v => set('facebook_page_id', v)} placeholder="123456789" mono />
              </div>
              <div>
                <Label>Verify Token</Label>
                <Input value={str('facebook_verify_token')} onChange={v => set('facebook_verify_token', v)} placeholder="omniflow_fb_2024" mono />
              </div>
            </div>
            <div>
              <Label>Page Access Token</Label>
              <Input value={str('facebook_access_token')} onChange={v => set('facebook_access_token', v)} placeholder="EAAxxxxx..." secret mono />
            </div>
            <CopyRow label="URL Webhook → pegar en Meta Developers" value={`${BACKEND_HOST}/api/v1/webhooks/meta`} accent="#1877f2" />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <SaveBtn onClick={() => save('fb', ['facebook_page_id', 'facebook_access_token', 'facebook_verify_token'])} saving={saving === 'fb'} saved={saved === 'fb'} color="#1877f2" />
            </div>
          </div>
        </ChannelCard>

        {/* ── TIKTOK ── */}
        <ChannelCard title="TikTok Lead Generation" color="#ff0050" connected={bool('has_tiktok')} icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z"/>
          </svg>
        }>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#0d1017', borderRadius: 10, padding: '14px 16px' }}>
              <Steps items={[
                'Crea una cuenta en <a href="https://business-api.tiktok.com" target="_blank" style="color:#ff0050">TikTok for Business</a>',
                'Ve a Developer Portal → crea una App y copia el <strong>App ID</strong> y <strong>App Secret</strong>',
                'Genera un <strong>Access Token</strong> para Lead Ads desde Marketing API',
                'Configura el webhook URL abajo en tu App de TikTok',
              ]} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><Label>TikTok App ID</Label><Input value={str('tiktok_app_id')} onChange={v => set('tiktok_app_id', v)} placeholder="7xxxxxxxxxxxxx" mono /></div>
              <div><Label>App Secret</Label><Input value={str('tiktok_app_secret')} onChange={v => set('tiktok_app_secret', v)} placeholder="xxxxxxxx" secret mono /></div>
            </div>
            <div>
              <Label>Access Token (Lead Ads)</Label>
              <Input value={str('tiktok_access_token')} onChange={v => set('tiktok_access_token', v)} placeholder="act.xxxxx" secret mono />
            </div>
            <CopyRow label="URL Webhook → TikTok for Business" value={`${BACKEND_HOST}/api/v1/webhooks/tiktok`} accent="#ff0050" />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <SaveBtn onClick={() => save('tt', ['tiktok_app_id', 'tiktok_app_secret', 'tiktok_access_token'])} saving={saving === 'tt'} saved={saved === 'tt'} color="#ff0050" />
            </div>
          </div>
        </ChannelCard>

        {/* ── SHOPIFY ── */}
        <ChannelCard title="Shopify" color="#96bf48" connected={bool('has_shopify')} icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.337 23.979l7.216-1.561s-2.6-17.569-2.617-17.681a.348.348 0 00-.342-.295c-.15 0-2.888-.059-2.888-.059s-1.923-1.865-2.131-2.072v21.668zm-2.488 0V2.47c-.166.048-3.408.94-3.408.94L7.802 22.418l5.047 1.561zm-4.094-13.7s-.688-.358-1.527-.358c-1.23 0-1.289.772-1.289.966 0 1.061 2.766 1.468 2.766 3.952 0 1.954-1.238 3.213-2.907 3.213-2 0-3.022-1.25-3.022-1.25l.535-1.765s1.055.905 1.944.905c.581 0 .818-.458.818-.793 0-1.384-2.27-1.445-2.27-3.714C3.803 9.5 5.032 8 7.394 8c.967 0 1.45.276 1.45.276l-.089 2.003z"/>
          </svg>
        }>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#0d1017', borderRadius: 10, padding: '14px 16px' }}>
              <Steps items={[
                'En Shopify Admin → Configuración → Apps y canales de venta → Develop apps → Create an app',
                'Activa permisos: <strong>read_orders, read_customers, read_checkouts</strong>',
                'Instala la app y copia el <strong>Admin API access token</strong>',
                'En Notificaciones → Webhooks, agrega los eventos abajo con la URL de OmniFlow',
              ]} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><Label>Shop Domain</Label><Input value={str('shopify_shop_domain')} onChange={v => set('shopify_shop_domain', v)} placeholder="tutienda.myshopify.com" mono /></div>
              <div><Label>Webhook Secret</Label><Input value={str('shopify_webhook_secret')} onChange={v => set('shopify_webhook_secret', v)} placeholder="shpss_xxxxx" secret mono /></div>
            </div>
            <div><Label>Admin API Access Token</Label><Input value={str('shopify_access_token')} onChange={v => set('shopify_access_token', v)} placeholder="shpat_xxxxx" secret mono /></div>
            {['orders/create — Pedidos nuevos', 'customers/create — Clientes nuevos', 'checkouts/create — Carritos abandonados'].map(ev => (
              <CopyRow key={ev} label={`Evento Shopify: ${ev.split(' — ')[1]}`} value={`${BACKEND_HOST}/api/v1/webhooks/shopify`} accent="#96bf48" />
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <SaveBtn onClick={() => save('sh', ['shopify_shop_domain', 'shopify_access_token', 'shopify_webhook_secret'])} saving={saving === 'sh'} saved={saved === 'sh'} color="#96bf48" />
            </div>
          </div>
        </ChannelCard>

        {/* ── EMAIL ── */}
        <ChannelCard title="Email entrante (SMTP / SendGrid / Mailgun)" color="#f59e0b" connected={bool('has_email')} icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
        }>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Label>Proveedor</Label>
              <select value={str('email_provider')} onChange={e => set('email_provider', e.target.value)}
                style={{ width: '100%', background: '#0d1017', border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none' }}>
                <option value="">Seleccionar proveedor...</option>
                <option value="smtp">SMTP (Gmail, Outlook, etc.)</option>
                <option value="sendgrid">SendGrid</option>
                <option value="mailgun">Mailgun</option>
              </select>
            </div>
            {str('email_provider') === 'smtp' && <>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div><Label>SMTP Host</Label><Input value={str('smtp_host')} onChange={v => set('smtp_host', v)} placeholder="smtp.gmail.com" mono /></div>
                <div><Label>Puerto</Label><Input value={str('smtp_port')} onChange={v => set('smtp_port', v)} placeholder="587" mono /></div>
              </div>
              <div><Label>Usuario SMTP</Label><Input value={str('smtp_user')} onChange={v => set('smtp_user', v)} placeholder="tu@gmail.com" /></div>
              <div><Label>Contraseña / App Password</Label><Input value={str('smtp_password')} onChange={v => set('smtp_password', v)} placeholder="xxxx xxxx xxxx xxxx" secret /></div>
              <div><Label>Email remitente</Label><Input value={str('smtp_from_address')} onChange={v => set('smtp_from_address', v)} placeholder="hola@tuempresa.com" /></div>
            </>}
            {str('email_provider') === 'sendgrid' && <>
              <div><Label>SendGrid API Key</Label><Input value={str('sendgrid_api_key')} onChange={v => set('sendgrid_api_key', v)} placeholder="SG.xxxxx" secret mono /></div>
              <div><Label>Email remitente</Label><Input value={str('smtp_from_address')} onChange={v => set('smtp_from_address', v)} placeholder="hola@tuempresa.com" /></div>
              <CopyRow label="Inbound Parse Webhook (SendGrid)" value={`${BACKEND_HOST}/api/v1/webhooks/email`} accent="#f59e0b" />
            </>}
            {str('email_provider') === 'mailgun' && <>
              <div><Label>Mailgun API Key</Label><Input value={str('mailgun_api_key')} onChange={v => set('mailgun_api_key', v)} placeholder="key-xxxxx" secret mono /></div>
              <div><Label>Mailgun Domain</Label><Input value={str('mailgun_domain')} onChange={v => set('mailgun_domain', v)} placeholder="mg.tuempresa.com" mono /></div>
              <div><Label>Email remitente</Label><Input value={str('smtp_from_address')} onChange={v => set('smtp_from_address', v)} placeholder="hola@tuempresa.com" /></div>
              <CopyRow label="Inbound Routes Webhook (Mailgun)" value={`${BACKEND_HOST}/api/v1/webhooks/email`} accent="#f59e0b" />
            </>}
            {str('email_provider') && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <SaveBtn onClick={() => save('em', ['email_provider', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from_address', 'sendgrid_api_key', 'mailgun_api_key', 'mailgun_domain'])} saving={saving === 'em'} saved={saved === 'em'} color="#f59e0b" />
              </div>
            )}
          </div>
        </ChannelCard>

      </div>
    </div>
  )
}
