'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'

const C = {
  base: '#0a0b0d', card: '#161a22', surface: '#111318',
  border: 'rgba(255,255,255,0.07)', accent: '#00e5a0',
  text: '#e2e8f0', muted: '#64748b', red: '#f87171',
  yellow: '#fbbf24', blue: '#60a5fa',
}

interface Broadcast {
  id: number
  name: string
  channel: string
  message: string
  status: string
  sent_count: number
  failed_count: number
  filter_tag: string | null
  created_at: string
  sent_at: string | null
}

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: '#25d366',
  instagram: '#e1306c',
  facebook: '#1877f2',
}

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
}

const STATUS_COLORS: Record<string, string> = {
  draft: C.muted,
  sending: C.yellow,
  done: C.accent,
  failed: C.red,
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sending: 'Enviando…',
  done: 'Enviado',
  failed: 'Fallido',
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
      background: color + '22', color, textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>{label}</span>
  )
}

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<number | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', channel: 'whatsapp', message: '', filter_tag: '' })
  const [saving, setSaving] = useState(false)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const load = async () => {
    try {
      const { data } = await api.get('/broadcasts/')
      setBroadcasts(data)
    } catch {
      showToast('Error al cargar broadcasts', false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.name || !form.message) return showToast('Nombre y mensaje son requeridos', false)
    setSaving(true)
    try {
      await api.post('/broadcasts/', {
        name: form.name,
        channel: form.channel,
        message: form.message,
        filter_tag: form.filter_tag || null,
      })
      setForm({ name: '', channel: 'whatsapp', message: '', filter_tag: '' })
      setShowForm(false)
      showToast('Campaña creada como borrador')
      load()
    } catch {
      showToast('Error al crear campaña', false)
    } finally {
      setSaving(false)
    }
  }

  const send = async (id: number) => {
    if (!confirm('¿Enviar esta campaña a todos los contactos ahora?')) return
    setSending(id)
    try {
      await api.post(`/broadcasts/${id}/send`)
      showToast('Enviando campaña en segundo plano…')
      setTimeout(load, 3000)
    } catch (e: any) {
      showToast(e?.response?.data?.detail || 'Error al enviar', false)
    } finally {
      setSending(null)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar este borrador?')) return
    try {
      await api.delete(`/broadcasts/${id}`)
      showToast('Eliminado')
      load()
    } catch (e: any) {
      showToast(e?.response?.data?.detail || 'Error al eliminar', false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 12,
    background: C.surface, border: `1px solid ${C.border}`, color: C.text,
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ background: C.base, minHeight: '100vh', padding: '32px 24px', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Broadcasts Masivos</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>
            Envía campañas segmentadas a tus contactos por WhatsApp, Instagram o Facebook
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            background: C.accent, color: '#000', border: 'none', borderRadius: 8,
            padding: '9px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          + Nueva campaña
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: 20, marginBottom: 24,
        }}>
          <h2 style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Nueva campaña</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Nombre</div>
              <input
                style={inputStyle}
                placeholder="Ej: Promo Mayo"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Canal</div>
              <select
                style={{ ...inputStyle }}
                value={form.channel}
                onChange={e => setForm(p => ({ ...p, channel: e.target.value }))}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram DM</option>
                <option value="facebook">Facebook Messenger</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Mensaje</div>
            <textarea
              style={{ ...inputStyle, resize: 'vertical' }}
              rows={4}
              placeholder="Escribe el mensaje que recibirán tus contactos…"
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Filtro por campaña/etiqueta (opcional)
            </div>
            <input
              style={inputStyle}
              placeholder="Dejar vacío para enviar a todos los contactos"
              value={form.filter_tag}
              onChange={e => setForm(p => ({ ...p, filter_tag: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={create}
              disabled={saving}
              style={{
                background: C.accent, color: '#000', border: 'none', borderRadius: 8,
                padding: '9px 18px', fontSize: 12, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? 'Guardando…' : 'Guardar borrador'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                background: C.surface, color: C.text, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '9px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', paddingTop: 60 }}>Cargando…</div>
      ) : broadcasts.length === 0 ? (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: 48, textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📣</div>
          <div style={{ color: C.text, fontWeight: 600, marginBottom: 6 }}>Sin campañas todavía</div>
          <div style={{ color: C.muted, fontSize: 13 }}>
            Crea tu primera campaña masiva y llega a todos tus contactos en segundos.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {broadcasts.map(b => (
            <div
              key={b.id}
              style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
              }}
            >
              {/* Channel dot */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: (CHANNEL_COLORS[b.channel] || C.muted) + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 16 }}>
                  {b.channel === 'whatsapp' ? '💬' : b.channel === 'instagram' ? '📷' : '👥'}
                </span>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{b.name}</span>
                  <Badge
                    label={CHANNEL_LABELS[b.channel] || b.channel}
                    color={CHANNEL_COLORS[b.channel] || C.muted}
                  />
                  <Badge
                    label={STATUS_LABELS[b.status] || b.status}
                    color={STATUS_COLORS[b.status] || C.muted}
                  />
                </div>
                <div style={{
                  color: C.muted, fontSize: 12,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{b.message}</div>
                {b.status !== 'draft' && (
                  <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
                    ✓ {b.sent_count} enviados · ✗ {b.failed_count} fallidos
                    {b.sent_at && ` · ${new Date(b.sent_at).toLocaleString('es-CL')}`}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {b.status === 'draft' && (
                  <>
                    <button
                      onClick={() => send(b.id)}
                      disabled={sending === b.id}
                      style={{
                        background: C.accent + '22', color: C.accent, border: `1px solid ${C.accent}44`,
                        borderRadius: 7, padding: '6px 14px', fontSize: 11, fontWeight: 700,
                        cursor: sending === b.id ? 'not-allowed' : 'pointer',
                        opacity: sending === b.id ? 0.5 : 1,
                      }}
                    >
                      {sending === b.id ? 'Enviando…' : '▶ Enviar ahora'}
                    </button>
                    <button
                      onClick={() => remove(b.id)}
                      style={{
                        background: C.red + '11', color: C.red, border: `1px solid ${C.red}33`,
                        borderRadius: 7, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Eliminar
                    </button>
                  </>
                )}
                {b.status === 'sending' && (
                  <span style={{ color: C.yellow, fontSize: 12, fontWeight: 600 }}>Enviando…</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: toast.ok ? C.accent + '18' : C.red + '18',
          color: toast.ok ? C.accent : C.red,
          border: `1px solid ${toast.ok ? C.accent : C.red}44`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </div>
  )
}
