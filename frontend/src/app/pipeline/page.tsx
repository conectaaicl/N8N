'use client'

import { useState, useEffect, useCallback } from 'react'
import { crmAPI } from '@/lib/api'
import {
  DollarSign, User, TrendingUp, ChevronRight, ChevronLeft,
  Target, RefreshCw, Search, Phone, Mail, Zap
} from 'lucide-react'

interface ContactRow { id: number; name: string; phone?: string; email?: string; source?: string; lead_score: number; intent?: string; last_interaction?: string }
interface DealContact { id: number; name: string; lead_score: number }
interface Deal { id: number; title: string; value: number; status: string; contact: DealContact }
interface Stage { id: number; name: string; deals: Deal[] }

function scoreColor(score: number) {
  if (score >= 70) return 'text-green-400 bg-green-400/10'
  if (score >= 40) return 'text-amber-400 bg-amber-400/10'
  return 'text-slate-400 bg-white/5'
}

const STAGE_COLORS = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#ef4444']

const SOURCE_COLORS: Record<string, string> = {
  web: '#7c3aed', whatsapp: '#25d366', instagram: '#e1306c',
  facebook: '#1877f2', email: '#f59e0b', tiktok: '#94a3b8',
}

export default function PipelinePage() {
  const [tab, setTab] = useState<'pipeline' | 'contacts'>('pipeline')

  // Pipeline
  const [stages, setStages] = useState<Stage[]>([])
  const [loadingPipeline, setLoadingPipeline] = useState(true)
  const [moving, setMoving] = useState<number | null>(null)

  // Contacts
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [totalContacts, setTotalContacts] = useState(0)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [contactPage, setContactPage] = useState(0)
  const PAGE_SIZE = 50

  const fetchPipeline = useCallback(() => {
    setLoadingPipeline(true)
    crmAPI.getPipeline()
      .then((r) => setStages(r.data))
      .catch(console.error)
      .finally(() => setLoadingPipeline(false))
  }, [])

  const fetchContacts = useCallback(() => {
    setLoadingContacts(true)
    crmAPI.getContacts({ search: search || undefined, source: sourceFilter || undefined, limit: PAGE_SIZE, offset: contactPage * PAGE_SIZE })
      .then((r) => { setContacts(r.data.contacts); setTotalContacts(r.data.total) })
      .catch(console.error)
      .finally(() => setLoadingContacts(false))
  }, [search, sourceFilter, contactPage])

  useEffect(() => { fetchPipeline() }, [fetchPipeline])

  useEffect(() => {
    if (tab === 'contacts') fetchContacts()
  }, [tab, fetchContacts])

  const moveDeal = async (dealId: number, targetStageId: number) => {
    setMoving(dealId)
    try { await crmAPI.moveDeal(dealId, targetStageId); fetchPipeline() }
    catch (err) { console.error(err) }
    finally { setMoving(null) }
  }

  const totalValue = stages.reduce((sum, s) => sum + s.deals.reduce((a, d) => a + (d.value || 0), 0), 0)
  const totalDeals = stages.reduce((sum, s) => sum + s.deals.length, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header + tabs */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">CRM</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {tab === 'pipeline'
                ? `${totalDeals} deals · $${totalValue.toLocaleString()} valor total`
                : `${totalContacts.toLocaleString()} contactos`}
            </p>
          </div>
          <button
            onClick={tab === 'pipeline' ? fetchPipeline : fetchContacts}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white px-3 py-2 rounded-lg transition-all text-sm"
          >
            <RefreshCw size={13} className={(loadingPipeline || loadingContacts) ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
        <div className="flex gap-1">
          {(['pipeline', 'contacts'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              {t === 'pipeline' ? 'Pipeline' : 'Contactos'}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline view */}
      {tab === 'pipeline' && (
        loadingPipeline ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw size={16} className="animate-spin text-slate-500" />
          </div>
        ) : stages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Target size={40} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Sin etapas en el pipeline</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto p-6">
            <div className="flex gap-4 h-full min-h-[500px]" style={{ minWidth: `${stages.length * 288 + (stages.length - 1) * 16}px` }}>
              {stages.map((stage, idx) => {
                const color = STAGE_COLORS[idx % STAGE_COLORS.length]
                const prev = idx > 0 ? stages[idx - 1] : null
                const next = idx < stages.length - 1 ? stages[idx + 1] : null
                return (
                  <div key={stage.id} className="w-72 flex-shrink-0 flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-xs font-semibold text-white uppercase tracking-wide">{stage.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${color}20`, color }}>{stage.deals.length}</span>
                      </div>
                      <span className="text-xs text-slate-600">${stage.deals.reduce((a, d) => a + (d.value || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto">
                      {stage.deals.length === 0 ? (
                        <div className="h-24 rounded-xl border-2 border-dashed border-white/5 flex items-center justify-center text-xs text-slate-700">Sin deals</div>
                      ) : stage.deals.map((deal) => (
                        <div key={deal.id} className="bg-[#0d0d1a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all group">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="text-sm font-medium text-white leading-tight">{deal.title || `Deal #${deal.id}`}</h4>
                            {deal.contact.lead_score >= 70 && (
                              <div className="flex items-center gap-0.5 text-green-400 shrink-0">
                                <TrendingUp size={10} /><span className="text-[9px] font-bold">HOT</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <User size={10} className="text-slate-600" />
                            <span className="text-xs text-slate-500 truncate">{deal.contact.name}</span>
                            <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded ${scoreColor(deal.contact.lead_score)}`}>{deal.contact.lead_score}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-3">
                            <DollarSign size={11} className="text-green-400" />
                            <span className="text-sm font-semibold text-green-400">{(deal.value || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {prev && (
                              <button onClick={() => moveDeal(deal.id, prev.id)} disabled={moving === deal.id}
                                className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] transition-all disabled:opacity-40">
                                <ChevronLeft size={10} />{prev.name}
                              </button>
                            )}
                            {next && (
                              <button onClick={() => moveDeal(deal.id, next.id)} disabled={moving === deal.id}
                                className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] transition-all disabled:opacity-40"
                                style={{ background: `${color}20`, color }}>
                                {next.name}<ChevronRight size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      )}

      {/* Contacts view */}
      {tab === 'contacts' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="px-6 py-3 border-b border-white/5 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setContactPage(0) }}
                placeholder="Buscar nombre, teléfono, email..."
                className="w-full bg-white/5 border border-white/5 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40" />
            </div>
            <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setContactPage(0) }}
              className="bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500/40">
              <option value="">Todos los canales</option>
              {['web', 'whatsapp', 'instagram', 'facebook', 'email', 'tiktok'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loadingContacts ? (
              <div className="flex items-center justify-center p-12">
                <RefreshCw size={16} className="animate-spin text-slate-500" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex items-center justify-center p-12 text-center">
                <div>
                  <User size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Sin contactos{search ? ' para esta búsqueda' : ''}</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="border-b border-white/5 bg-[#080812] sticky top-0">
                  <tr className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                    <th className="px-4 py-3">Contacto</th>
                    <th className="px-4 py-3">Canal</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Intención</th>
                    <th className="px-4 py-3">Última interacción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {contacts.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/10 flex items-center justify-center text-xs font-bold text-violet-300 shrink-0">
                            {(c.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{c.name || 'Sin nombre'}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {c.phone && <span className="text-[10px] text-slate-600 flex items-center gap-0.5"><Phone size={8} />{c.phone}</span>}
                              {c.email && <span className="text-[10px] text-slate-600 flex items-center gap-0.5"><Mail size={8} />{c.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {c.source ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                            style={{ background: `${SOURCE_COLORS[c.source] || '#7c3aed'}20`, color: SOURCE_COLORS[c.source] || '#7c3aed' }}>
                            {c.source}
                          </span>
                        ) : <span className="text-[10px] text-slate-700">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreColor(c.lead_score)}`}>{c.lead_score}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {c.intent ? (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Zap size={9} className="text-violet-400" />{c.intent.replace('_', ' ')}
                          </span>
                        ) : <span className="text-[10px] text-slate-700">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {c.last_interaction
                          ? new Date(c.last_interaction).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalContacts > PAGE_SIZE && (
            <div className="border-t border-white/5 px-6 py-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {contactPage * PAGE_SIZE + 1}–{Math.min((contactPage + 1) * PAGE_SIZE, totalContacts)} de {totalContacts}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setContactPage(p => Math.max(0, p - 1))} disabled={contactPage === 0}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-slate-400 disabled:opacity-30 hover:bg-white/10 transition-all">
                  Anterior
                </button>
                <button onClick={() => setContactPage(p => p + 1)} disabled={(contactPage + 1) * PAGE_SIZE >= totalContacts}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-slate-400 disabled:opacity-30 hover:bg-white/10 transition-all">
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
