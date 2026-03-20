'use client'

import { useState, useEffect, useRef } from 'react'
import { conversationsAPI } from '@/lib/api'
import {
  Send, Phone, User, Search, Instagram, Facebook,
  Globe, RefreshCw, Bot, UserCheck, MessageSquare, X,
  ChevronRight, Zap, Clock
} from 'lucide-react'

interface Contact {
  id: number; name: string; phone: string
  lead_score: number; intent: string
  ip_address?: string; external_id?: string
}
interface Conv {
  id: number; channel: string; status: string
  last_message: string; updated_at: string
  bot_active: boolean; contact: Contact
}
interface Message {
  id: number; sender_type: string; content: string; timestamp: string
}

const CH_COLOR: Record<string, string> = {
  whatsapp: '#25d366', instagram: '#e1306c',
  facebook: '#1877f2', web: '#7c3aed', webchat: '#7c3aed',
}
const CH_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp', instagram: 'Instagram',
  facebook: 'Facebook', web: 'Web Chat', webchat: 'Web Chat',
}
const CH_EMOJI: Record<string, string> = {
  whatsapp: '💬', instagram: '📸', facebook: '🔵',
  web: '💻', webchat: '💻',
}

function scoreColor(s: number) {
  if (s >= 70) return { bg: 'rgba(16,185,129,0.12)', text: '#34d399' }
  if (s >= 40) return { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' }
  return { bg: 'rgba(255,255,255,0.05)', text: '#64748b' }
}

function relativeTime(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'ahora'
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
  } catch { return '' }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
}

const QUICK_REPLIES = [
  'Hola, ¿en qué te puedo ayudar hoy?',
  'Permíteme verificar esa información.',
  'Te paso los precios actualizados.',
  '¿Deseas proceder con la compra?',
  'En breve te contacta un agente.',
]

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conv[]>([])
  const [filtered, setFiltered] = useState<Conv[]>([])
  const [selected, setSelected] = useState<Conv | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'bot' | 'human' | 'closed'>('all')
  const [filterCh, setFilterCh] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [handoffLoading, setHandoffLoading] = useState(false)
  const [showDetail, setShowDetail] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadConversations = () => {
    conversationsAPI.list()
      .then(r => { setConversations(r.data); setFiltered(r.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadConversations()
    const iv = setInterval(loadConversations, 15000)
    return () => clearInterval(iv)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selected) return
    const poll = setInterval(() => {
      conversationsAPI.getMessages(selected.id).then(r => setMessages(r.data)).catch(() => {})
    }, 5000)
    conversationsAPI.getMessages(selected.id).then(r => setMessages(r.data)).catch(() => {})
    return () => clearInterval(poll)
  }, [selected])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    let list = conversations
    if (filterTab === 'bot') list = list.filter(c => c.bot_active !== false)
    if (filterTab === 'human') list = list.filter(c => c.bot_active === false)
    if (filterTab === 'closed') list = list.filter(c => c.status === 'closed')
    if (filterCh !== 'all') list = list.filter(c => c.channel === filterCh)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.contact.name.toLowerCase().includes(q) ||
        c.contact.phone?.includes(q) ||
        c.last_message?.toLowerCase().includes(q)
      )
    }
    setFiltered(list)
  }, [search, conversations, filterTab, filterCh])

  const handleHandoff = async () => {
    if (!selected || handoffLoading) return
    setHandoffLoading(true)
    const newBotActive = !(selected.bot_active !== false)
    try {
      await conversationsAPI.toggleHandoff(selected.id, newBotActive)
      const updated = { ...selected, bot_active: newBotActive }
      setSelected(updated)
      setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, bot_active: newBotActive } : c))
      setFiltered(prev => prev.map(c => c.id === selected.id ? { ...c, bot_active: newBotActive } : c))
    } catch (e) { console.error(e) }
    finally { setHandoffLoading(false) }
  }

  const handleSend = async () => {
    if (!input.trim() || !selected || sending) return
    setSending(true)
    try {
      await conversationsAPI.send(selected.id, input.trim())
      setInput('')
      const r = await conversationsAPI.getMessages(selected.id)
      setMessages(r.data)
    } catch (e) { console.error(e) }
    finally { setSending(false) }
  }

  const channels = ['all', ...Array.from(new Set(conversations.map(c => c.channel)))]

  return (
    <div className="flex h-full overflow-hidden" style={{ height: 'calc(100vh - 0px)', background: '#080812' }}>

      {/* ── COL 1: LISTA ── */}
      <div style={{ width: 288, minWidth: 288, background: '#0a0a14', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>Conversaciones</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{filtered.length}</span>
              <button onClick={loadConversations} style={{ padding: 5, borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                <RefreshCw size={11} />
              </button>
            </div>
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '7px 10px 7px 28px', fontSize: 12, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 2, padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', overflowX: 'auto' }}>
          {(['all', 'bot', 'human', 'closed'] as const).map(tab => (
            <button key={tab} onClick={() => setFilterTab(tab)}
              style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', transition: 'all .15s',
                background: filterTab === tab ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: filterTab === tab ? '#a78bfa' : '#64748b',
                borderColor: filterTab === tab ? 'rgba(124,58,237,0.3)' : 'transparent',
              }}>
              {tab === 'all' ? 'Todos' : tab === 'bot' ? 'Bot' : tab === 'human' ? 'Humano' : 'Cerrados'}
            </button>
          ))}
        </div>

        {/* Channel filters */}
        <div style={{ display: 'flex', gap: 4, padding: '6px 10px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', overflowX: 'auto' }}>
          {channels.map(ch => (
            <button key={ch} onClick={() => setFilterCh(ch)} title={ch}
              style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', flexShrink: 0,
                background: filterCh === ch ? `${CH_COLOR[ch] || '#7c3aed'}18` : 'rgba(255,255,255,0.04)',
                borderColor: filterCh === ch ? `${CH_COLOR[ch] || '#7c3aed'}40` : 'rgba(255,255,255,0.06)',
                opacity: filterCh !== 'all' && filterCh !== ch ? 0.4 : 1,
              }}>
              {ch === 'all' ? <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>ALL</span> : CH_EMOJI[ch] || '•'}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, animation: 'pulse 1.5s infinite' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ height: 11, background: 'rgba(255,255,255,0.05)', borderRadius: 4, width: '70%' }} />
                    <div style={{ height: 9, background: 'rgba(255,255,255,0.03)', borderRadius: 4, width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <MessageSquare size={28} style={{ color: '#1e293b', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 12, color: '#475569' }}>{search ? 'Sin resultados' : 'Sin conversaciones'}</p>
            </div>
          ) : filtered.map(conv => {
            const color = CH_COLOR[conv.channel] || '#7c3aed'
            const sc = scoreColor(conv.contact.lead_score)
            const isSel = selected?.id === conv.id
            return (
              <button key={conv.id} onClick={() => setSelected(conv)}
                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', display: 'flex', gap: 9, alignItems: 'flex-start', cursor: 'pointer', transition: 'background .12s', borderLeft: `2px solid ${isSel ? '#7c3aed' : 'transparent'}`, borderRight: 'none', borderTop: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)', background: isSel ? 'rgba(124,58,237,0.08)' : 'transparent' }}
              >
                {/* Avatar */}
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color, flexShrink: 0, position: 'relative', fontFamily: 'monospace' }}>
                  {initials(conv.contact.name)}
                  <div style={{ position: 'absolute', bottom: -1, right: -1, width: 13, height: 13, borderRadius: '50%', background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, border: '1.5px solid #0a0a14' }}>
                    {CH_EMOJI[conv.channel] || '•'}
                  </div>
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{conv.contact.name}</span>
                    <span style={{ fontSize: 10, color: '#334155', fontFamily: 'monospace', flexShrink: 0 }}>{relativeTime(conv.updated_at)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 5 }}>
                    {conv.bot_active !== false ? '🤖 ' : '👤 '}{conv.last_message || 'Sin mensajes'}
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 8, fontWeight: 600, background: sc.bg, color: sc.text }}>
                      {conv.contact.lead_score}pts
                    </span>
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 8, background: `${color}12`, color }}>
                      {CH_LABEL[conv.channel] || conv.channel}
                    </span>
                    {conv.contact.intent && (
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: '#64748b' }}>
                        {conv.contact.intent}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── COL 2: CHAT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#080812' }}>
        {selected ? (
          <>
            {/* Chat header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0a0a14', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${CH_COLOR[selected.channel] || '#7c3aed'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: CH_COLOR[selected.channel] || '#7c3aed', flexShrink: 0, fontFamily: 'monospace' }}>
                {initials(selected.contact.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{selected.contact.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: `${CH_COLOR[selected.channel] || '#7c3aed'}12`, color: CH_COLOR[selected.channel] || '#7c3aed', fontWeight: 500 }}>
                    {CH_EMOJI[selected.channel]} {CH_LABEL[selected.channel] || selected.channel}
                  </span>
                  {selected.contact.phone && (
                    <span style={{ fontSize: 10, color: '#475569' }}>{selected.contact.phone}</span>
                  )}
                  {selected.contact.external_id && (
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#334155' }}>ID: {selected.contact.external_id}</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Score */}
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, fontWeight: 600, ...scoreColor(selected.contact.lead_score) }}>
                  Score {selected.contact.lead_score}
                </span>
                {/* Bot toggle */}
                <button onClick={handleHandoff} disabled={handoffLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 11px', borderRadius: 20, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all .15s',
                    background: selected.bot_active !== false ? 'rgba(124,58,237,0.12)' : 'rgba(245,158,11,0.12)',
                    color: selected.bot_active !== false ? '#a78bfa' : '#fbbf24',
                    borderColor: selected.bot_active !== false ? 'rgba(124,58,237,0.3)' : 'rgba(245,158,11,0.3)',
                    opacity: handoffLoading ? 0.5 : 1,
                  }}>
                  {selected.bot_active !== false ? <><Bot size={11} /> Bot activo</> : <><UserCheck size={11} /> En control</>}
                </button>
                {/* Detail toggle */}
                <button onClick={() => setShowDetail(v => !v)}
                  style={{ padding: 6, borderRadius: 8, background: showDetail ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)', border: 'none', cursor: 'pointer', color: showDetail ? '#a78bfa' : '#64748b', display: 'flex' }}>
                  <ChevronRight size={14} style={{ transform: showDetail ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                </button>
              </div>
            </div>

            {/* Bot status bar */}
            {selected.bot_active !== false && (
              <div style={{ padding: '6px 16px', background: 'rgba(124,58,237,0.06)', borderBottom: '1px solid rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#a78bfa' }}>
                  <Zap size={11} />
                  Bot respondiendo automáticamente
                </div>
                <button onClick={handleHandoff}
                  style={{ fontSize: 10, color: '#fbbf24', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '2px 8px', cursor: 'pointer' }}>
                  Tomar control
                </button>
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: 12, color: '#334155' }}>Sin mensajes en esta conversación</p>
                </div>
              ) : messages.map(msg => {
                const isOut = msg.sender_type === 'human' || msg.sender_type === 'bot' || msg.sender_type === 'agent'
                const isBot = msg.sender_type === 'bot'
                const isAgent = msg.sender_type === 'agent' || msg.sender_type === 'human'
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end', maxWidth: '100%' }}>
                    {!isOut && (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${CH_COLOR[selected.channel] || '#7c3aed'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: CH_COLOR[selected.channel] || '#7c3aed', flexShrink: 0, fontWeight: 700 }}>
                        {initials(selected.contact.name)}
                      </div>
                    )}
                    <div style={{ maxWidth: '68%' }}>
                      {isOut && (
                        <div style={{ fontSize: 9, color: '#475569', textAlign: 'right', marginBottom: 2 }}>
                          {isBot ? '🤖 Bot IA' : '👤 Agente'}
                        </div>
                      )}
                      <div style={{ padding: '9px 13px', borderRadius: isOut ? '14px 14px 3px 14px' : '14px 14px 14px 3px', fontSize: 13, lineHeight: 1.5,
                        background: isOut
                          ? isBot ? 'rgba(124,58,237,0.25)' : 'rgba(16,185,129,0.15)'
                          : 'rgba(255,255,255,0.06)',
                        color: '#e2e8f0',
                        border: isOut
                          ? isBot ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(16,185,129,0.2)'
                          : '1px solid rgba(255,255,255,0.06)',
                      }}>
                        {msg.content}
                      </div>
                      <div style={{ fontSize: 9, color: '#334155', marginTop: 3, textAlign: isOut ? 'right' : 'left', fontFamily: 'monospace' }}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                    {isOut && (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: isBot ? 'rgba(124,58,237,0.15)' : 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>
                        {isBot ? '🤖' : '👤'}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '10px 14px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0a0a14', flexShrink: 0 }}>
              {/* Quick replies */}
              <div style={{ display: 'flex', gap: 5, marginBottom: 8, overflowX: 'auto', paddingBottom: 2 }}>
                {QUICK_REPLIES.map((qr, i) => (
                  <button key={i} onClick={() => setInput(qr)}
                    style={{ padding: '3px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 10, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s' }}
                    onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.4)'; (e.target as HTMLButtonElement).style.color = '#a78bfa' }}
                    onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.target as HTMLButtonElement).style.color = '#64748b' }}>
                    {qr.length > 28 ? qr.slice(0, 28) + '…' : qr}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={selected.bot_active !== false ? 'Bot activo — escribe para responder manualmente...' : 'Escribe un mensaje...'}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 13px', fontSize: 13, color: '#fff', outline: 'none', transition: 'border-color .15s' }}
                />
                <button onClick={handleSend} disabled={!input.trim() || sending}
                  style={{ width: 38, height: 38, borderRadius: 10, background: input.trim() ? '#7c3aed' : 'rgba(124,58,237,0.2)', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', flexShrink: 0 }}>
                  <Send size={15} color="#fff" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <MessageSquare size={40} style={{ color: '#1e293b' }} />
            <p style={{ fontSize: 14, color: '#475569' }}>Selecciona una conversación</p>
            <p style={{ fontSize: 12, color: '#1e293b' }}>WhatsApp, Instagram, Facebook y más aparecerán aquí</p>
          </div>
        )}
      </div>

      {/* ── COL 3: DETALLE ── */}
      {selected && showDetail && (
        <div style={{ width: 220, minWidth: 220, background: '#0a0a14', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          {/* Contacto */}
          <div style={{ padding: '14px 13px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 9, color: '#334155', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>Contacto</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                ['Nombre', selected.contact.name],
                ['Canal', CH_LABEL[selected.channel] || selected.channel],
                ['Teléfono', selected.contact.phone || '—'],
                ['Score', `${selected.contact.lead_score} pts`],
                ['Intención', selected.contact.intent || '—'],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                  <span style={{ color: '#475569' }}>{lbl}</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 500, textAlign: 'right', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Estado */}
          <div style={{ padding: '10px 13px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 9, color: '#334155', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Estado</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 8, fontWeight: 600, background: selected.bot_active !== false ? 'rgba(124,58,237,0.12)' : 'rgba(245,158,11,0.12)', color: selected.bot_active !== false ? '#a78bfa' : '#fbbf24' }}>
                {selected.bot_active !== false ? 'Bot activo' : 'Agente humano'}
              </span>
              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 8, background: selected.status === 'open' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: selected.status === 'open' ? '#34d399' : '#64748b', fontWeight: 600 }}>
                {selected.status === 'open' ? 'Abierto' : selected.status}
              </span>
            </div>
          </div>

          {/* Notas */}
          <div style={{ padding: '10px 13px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 9, color: '#334155', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Notas del agente</div>
            <textarea
              placeholder="Añadir nota sobre este contacto..."
              rows={4}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '7px 9px', fontSize: 11, color: '#94a3b8', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.5 }}
            />
          </div>

          {/* Respuestas rápidas */}
          <div style={{ padding: '10px 13px' }}>
            <div style={{ fontSize: 9, color: '#334155', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Respuestas rápidas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {QUICK_REPLIES.map((qr, i) => (
                <button key={i} onClick={() => setInput(qr)}
                  style={{ padding: '6px 9px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 7, fontSize: 10, color: '#64748b', cursor: 'pointer', textAlign: 'left', lineHeight: 1.4, transition: 'all .15s' }}
                  onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.3)'; (e.target as HTMLButtonElement).style.color = '#a78bfa' }}
                  onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.target as HTMLButtonElement).style.color = '#64748b' }}>
                  {qr}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
