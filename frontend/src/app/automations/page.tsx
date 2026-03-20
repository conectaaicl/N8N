'use client'

import { useState, useEffect, useCallback } from 'react'

const N8N_URL = 'https://n8n.conectaai.cl'
const WEBHOOK_BASE = 'https://n8n.conectaai.cl/webhook'

const C = {
  base: '#0a0b0d',
  surface: '#111318',
  card: '#161a22',
  border: 'rgba(255,255,255,0.06)',
  accent: '#00e5a0',
  text: '#e2e8f0',
  muted: '#64748b',
}

/* ─── Webhook config ─── */
const WEBHOOKS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    path: '/whatsapp',
    method: 'GET',
    color: '#25d366',
    verifyParam: 'hub.challenge',
    desc: 'Verificación Meta / mensajes entrantes',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.122 1.523 5.855L.057 23.5l5.775-1.507A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.893 0-3.668-.516-5.19-1.416l-.37-.221-3.43.895.92-3.341-.242-.384A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
    ),
  },
]

const WORKFLOW_TEMPLATES = [
  {
    id: 1,
    name: 'WhatsApp → IA → CRM',
    desc: 'Recibe mensaje de WhatsApp, analiza intención con IA y crea o actualiza contacto en el CRM.',
    trigger: 'Webhook WhatsApp',
    color: '#25d366',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.122 1.523 5.855L.057 23.5l5.775-1.507A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.893 0-3.668-.516-5.19-1.416l-.37-.221-3.43.895.92-3.341-.242-.384A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
    ),
  },
  {
    id: 2,
    name: 'Facebook Lead → Pipeline',
    desc: 'Captura leads de Facebook Lead Ads y los agrega automáticamente al pipeline de ventas.',
    trigger: 'Facebook Lead Ad',
    color: '#1877f2',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: 3,
    name: 'Instagram DM → Respuesta Auto',
    desc: 'Responde automáticamente mensajes directos de Instagram con mensajes personalizados.',
    trigger: 'Instagram DM',
    color: '#e1306c',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    id: 4,
    name: 'Lead Score Alto → Notificación',
    desc: 'Cuando un lead supera score 70, notifica al equipo de ventas por email o Slack.',
    trigger: 'Score > 70',
    color: '#00e5a0',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
  },
  {
    id: 5,
    name: 'Sin Respuesta → Follow-up',
    desc: 'Si un lead no responde en 24h, envía automáticamente un mensaje de seguimiento.',
    trigger: 'Timer 24h',
    color: '#f59e0b',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    id: 6,
    name: 'Web Form → Bienvenida',
    desc: 'Cuando alguien llena el formulario web, recibe un email y WhatsApp de bienvenida.',
    trigger: 'Webhook Web',
    color: '#06b6d4',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
    ),
  },
]

const STEPS = [
  { n: '01', title: 'Mensaje entra', desc: 'WhatsApp, IG, FB, Web', color: '#25d366' },
  { n: '02', title: 'OmniFlow recibe', desc: 'Webhook procesa el evento', color: C.accent },
  { n: '03', title: 'n8n activa flujo', desc: 'Lógica personalizada', color: '#f59e0b' },
  { n: '04', title: 'Acción ejecutada', desc: 'CRM, email, respuesta', color: '#e1306c' },
]

/* ─── Copy button ─── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} title="Copiar" style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: copied ? C.accent : C.muted, padding: '2px 4px', borderRadius: 4,
      display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
      transition: 'color .15s',
    }}>
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      )}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}

/* ─── Webhook Monitor Card ─── */
type TestResult = { ok: boolean; status: number; body: string; ms: number } | null

function WebhookMonitor() {
  const [results, setResults] = useState<Record<string, TestResult>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [challenge, setChallenge] = useState('omniflow_test')

  useEffect(() => {
    setChallenge('omniflow_' + Math.random().toString(36).slice(2, 8))
  }, [])

  const testWebhook = useCallback(async (wh: typeof WEBHOOKS[0]) => {
    setLoading(l => ({ ...l, [wh.id]: true }))
    setResults(r => ({ ...r, [wh.id]: null }))
    const start = Date.now()
    try {
      const url = `${WEBHOOK_BASE}${wh.path}?hub.mode=subscribe&hub.verify_token=omniflow&hub.challenge=${challenge}`
      const res = await fetch(url, { method: wh.method, signal: AbortSignal.timeout(10000) })
      const body = await res.text()
      setResults(r => ({ ...r, [wh.id]: { ok: res.ok && body.includes(challenge), status: res.status, body: body.slice(0, 120), ms: Date.now() - start } }))
    } catch (e) {
      setResults(r => ({ ...r, [wh.id]: { ok: false, status: 0, body: String(e), ms: Date.now() - start } }))
    }
    setLoading(l => ({ ...l, [wh.id]: false }))
  }, [challenge])

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.63 19.79 19.79 0 01.06 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
            </svg>
          </div>
          <div>
            <h3 style={{ fontWeight: 600, color: '#fff', fontSize: 14, margin: 0 }}>Monitor de Webhooks</h3>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Verifica que los endpoints responden correctamente</p>
          </div>
        </div>
        <a href="https://n8n.conectaai.cl/executions" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button style={{
            fontSize: 11, color: C.muted, background: 'none',
            border: `1px solid ${C.border}`, borderRadius: 7,
            padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            Ver ejecuciones en n8n
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
          </button>
        </a>
      </div>

      {/* Webhook rows */}
      {WEBHOOKS.map(wh => {
        const result = results[wh.id]
        const busy = loading[wh.id]
        const url = `${WEBHOOK_BASE}${wh.path}`
        return (
          <div key={wh.id} style={{
            background: '#0d1017', border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${wh.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: wh.color, flexShrink: 0 }}>
                {wh.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{wh.name}</span>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', background: `${wh.color}15`, color: wh.color, border: `1px solid ${wh.color}25`, padding: '1px 6px', borderRadius: 4 }}>{wh.method}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{wh.desc}</span>
                </div>
              </div>
              <button
                onClick={() => testWebhook(wh)}
                disabled={busy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: busy ? `${C.accent}10` : `${C.accent}15`,
                  border: `1px solid ${C.accent}30`, color: C.accent,
                  fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
                  cursor: busy ? 'wait' : 'pointer', transition: 'all .15s', flexShrink: 0,
                }}
              >
                {busy ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                )}
                {busy ? 'Probando...' : 'Probar'}
              </button>
            </div>

            {/* URL row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#080a0e', borderRadius: 7, padding: '6px 10px' }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.muted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {url}
              </span>
              <CopyBtn text={url} />
            </div>

            {/* Result */}
            {result && (
              <div style={{
                borderRadius: 8, padding: '10px 12px',
                background: result.ok ? '#00e5a008' : '#ef444408',
                border: `1px solid ${result.ok ? '#00e5a030' : '#ef444430'}`,
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {result.ok ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e5a0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  )}
                  <span style={{ fontWeight: 600, fontSize: 12, color: result.ok ? '#00e5a0' : '#ef4444' }}>
                    {result.ok ? `✓ Webhook activo — respondió en ${result.ms}ms` : `✗ Error — ${result.status === 0 ? 'sin respuesta / timeout' : `HTTP ${result.status}`}`}
                  </span>
                </div>
                {result.body && (
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.muted, background: '#0006', padding: '5px 8px', borderRadius: 5 }}>
                    {result.body}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Meta setup guide */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Configuración en Meta Developers</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { n: '1', text: 'Ve a developers.facebook.com → tu app → WhatsApp → Configuración' },
            { n: '2', text: `URL de devolución: ${WEBHOOK_BASE}/whatsapp` },
            { n: '3', text: 'Token de verificación: cualquier texto (ej: omniflow2024)' },
            { n: '4', text: 'Haz clic en "Verificar y guardar" — debe devolver el hub.challenge' },
            { n: '5', text: 'Suscríbete a los campos: messages, message_deliveries, message_reads' },
          ].map(({ n, text }) => (
            <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${C.accent}15`, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: C.accent, marginTop: 1 }}>{n}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: C.text }}>{text}</span>
                {n === '2' && <CopyBtn text={`${WEBHOOK_BASE}/whatsapp`} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Main page ─── */
export default function AutomationsPage() {
  const [n8nStatus, setN8nStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    fetch('/n8n/', { method: 'HEAD', mode: 'no-cors' })
      .then(() => setN8nStatus('online'))
      .catch(() => setN8nStatus('offline'))
  }, [])

  return (
    <div style={{ background: C.base, minHeight: '100vh', color: C.text, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>Automatizaciones</h1>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Motor de automatización omnicanal con n8n</p>
          </div>
          <a href={N8N_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: `${C.accent}15`, border: `1px solid ${C.accent}40`,
              color: C.accent, fontWeight: 600, fontSize: 13,
              padding: '9px 18px', borderRadius: 10, cursor: 'pointer', transition: 'all .15s',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Abrir n8n
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
            </button>
          </a>
        </div>

        {/* n8n status */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${C.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 600, color: '#fff', fontSize: 15 }}>n8n Workflow Engine</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {n8nStatus === 'checking' && <><span style={{ fontSize: 11, color: C.muted }}>Verificando...</span></>}
                  {n8nStatus === 'online' && <><div style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent }} /><span style={{ fontSize: 11, color: C.accent, fontWeight: 500 }}>En línea</span></>}
                  {n8nStatus === 'offline' && <><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /><span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 500 }}>Iniciando...</span></>}
                </div>
              </div>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>
                Editor visual de flujos · <span style={{ fontFamily: 'JetBrains Mono', color: C.accent, fontSize: 12, background: `${C.accent}12`, padding: '1px 6px', borderRadius: 4 }}>/n8n/</span>
              </p>
            </div>
          </div>
          <a href={N8N_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{ background: C.accent, color: '#000', fontWeight: 700, fontSize: 13, padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              Abrir editor
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
            </button>
          </a>
        </div>

        {/* Webhook Monitor */}
        <WebhookMonitor />

        {/* How it works */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px' }}>
          <h3 style={{ fontWeight: 600, color: '#fff', fontSize: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Cómo funciona la automatización
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {STEPS.map(({ n, title, desc, color }, i) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 600, color }}>
                  {n}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>{title}</p>
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.border} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600, color: '#fff', fontSize: 15, margin: 0 }}>Templates de Workflows</h3>
            <a href={N8N_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.accent, fontWeight: 500 }}>
                Crear nuevo en n8n
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {WORKFLOW_TEMPLATES.map(({ id, name, desc, trigger, icon, color }) => (
              <div key={id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ height: 2, borderRadius: 2, background: `linear-gradient(90deg, ${color}, transparent)`, marginBottom: -4 }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${color}18`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>{name}</p>
                    <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', background: `${color}15`, color, border: `1px solid ${color}30`, padding: '2px 7px', borderRadius: 5, display: 'inline-block', marginTop: 5 }}>{trigger}</span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, margin: 0 }}>{desc}</p>
                <a href={N8N_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: C.muted, fontWeight: 500, background: 'none', border: `1px solid ${C.border}`, borderRadius: 9, padding: '8px 0', cursor: 'pointer' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    Implementar en n8n
                  </button>
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
