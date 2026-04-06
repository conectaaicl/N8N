'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Wifi, MessageSquare, Zap, ArrowRight, Check, ChevronRight,
  Bot, BarChart3, Shield, Users, Star, ChevronDown, Globe,
  Phone, ShoppingBag, Mail
} from 'lucide-react'

// ── Animated counter ──────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      observer.disconnect()
      let start = 0
      const step = to / 60
      const t = setInterval(() => {
        start += step
        if (start >= to) { setVal(to); clearInterval(t) } else setVal(Math.floor(start))
      }, 16)
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [to])
  return <span ref={ref}>{val.toLocaleString('es-CL')}{suffix}</span>
}

// ── FAQ item ──────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <span className="font-medium text-white text-sm">{q}</span>
        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 shrink-0 ml-4 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
          {a}
        </div>
      )}
    </div>
  )
}

// ── Integration logos ─────────────────────────────────────────
const LOGOS = [
  { name: 'WhatsApp',  src: '/uploads/logos/whatsapp.svg'  },
  { name: 'Instagram', src: '/uploads/logos/instagram.svg' },
  { name: 'Facebook',  src: '/uploads/logos/facebook.svg'  },
  { name: 'TikTok',    src: '/uploads/logos/tiktok.svg'    },
  { name: 'Telegram',  src: '/uploads/logos/telegram.svg'  },
  { name: 'Shopify',   src: '/uploads/logos/shopify.svg'   },
  { name: 'OpenAI',    src: '/uploads/logos/openai.svg'    },
  { name: 'n8n',       src: '/uploads/logos/n8n.svg'       },
]

const CHANNELS = [
  { icon: Phone,       name: 'WhatsApp Business', desc: 'Mensajes, respuestas automáticas y notificaciones.', color: '#25d366' },
  { icon: '📷',        name: 'Instagram DMs',     desc: 'Responde comentarios y mensajes directos auto.', color: '#e1306c' },
  { icon: '👥',        name: 'Facebook Leads',    desc: 'Captura leads de formularios y Messenger.', color: '#1877f2' },
  { icon: '🎵',        name: 'TikTok Leads',      desc: 'Lead Generation de TikTok directo al CRM.', color: '#ff0050' },
  { icon: ShoppingBag, name: 'Shopify',           desc: 'Ventas, carrito abandonado, pedidos.', color: '#96bf48' },
  { icon: Mail,        name: 'Email',             desc: 'Campañas y secuencias automáticas.', color: '#f59e0b' },
  { icon: Globe,       name: 'Web Chat',          desc: 'Widget IA embebible en tu sitio.', color: '#7c3aed' },
  { icon: '✈️',        name: 'Telegram',          desc: 'Bot conversacional con IA en Telegram.', color: '#2AABEE' },
]

const PLANS = [
  {
    name: 'Starter', price: '29', per: '/mes',
    desc: 'Para negocios que están empezando',
    features: ['1,000 contactos', '5,000 mensajes/mes', 'WhatsApp + Web Chat', 'IA básica', 'Soporte email'],
    cta: 'Comenzar gratis', popular: false,
  },
  {
    name: 'Pro', price: '79', per: '/mes',
    desc: 'El favorito de equipos en crecimiento',
    features: ['10,000 contactos', '50,000 mensajes/mes', 'Todos los canales', 'n8n incluido', 'IA avanzada', 'Soporte prioritario'],
    cta: 'Empezar con Pro', popular: true,
  },
  {
    name: 'Enterprise', price: '199', per: '/mes',
    desc: 'Para empresas que no aceptan límites',
    features: ['Contactos ilimitados', 'Mensajes ilimitados', 'White-label total', 'Instancias dedicadas', 'SLA 99.9%', 'Manager dedicado'],
    cta: 'Hablar con ventas', popular: false,
  },
]

const TESTIMONIALS = [
  { name: 'Camila Torres', role: 'Dueña, TerraBlinds', text: 'OmniFlow transformó cómo atendemos clientes. Nuestro bot responde 24/7 y el equipo solo interviene para cerrar ventas.', stars: 5, avatar: 'CT' },
  { name: 'Rodrigo Méndez', role: 'CEO, ClinicaVet', text: 'Conectamos WhatsApp e Instagram en un día. Los leads que antes se perdían ahora llegan al CRM solos.', stars: 5, avatar: 'RM' },
  { name: 'Sofía Herrera', role: 'Marketing, ModaXpress', text: 'Las campañas de broadcast por WhatsApp tienen 85% de apertura. Nunca volvemos al email marketing tradicional.', stars: 5, avatar: 'SH' },
]

const FAQS = [
  { q: '¿Necesito saber programar para usar OmniFlow?', a: 'No. El 90% de la plataforma es punto y click. Para automatizaciones avanzadas con n8n ofrecemos plantillas listas y soporte dedicado.' },
  { q: '¿Cuánto tiempo tarda en estar funcionando?', a: 'Menos de una hora. Conectas tu WhatsApp Business, configuras el bot y listo. Los canales de Instagram y Facebook tardan 10 minutos adicionales.' },
  { q: '¿Los datos de mis clientes están seguros?', a: 'Sí. Cada empresa tiene su propia base de datos aislada (multi-tenant). Datos encriptados en reposo y en tránsito. Servidores en Europa.' },
  { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí, sin penalizaciones ni contratos de permanencia. Cancelas cuando quieras desde el panel y no se te cobra el siguiente mes.' },
  { q: '¿Qué pasa si supero el límite de mensajes?', a: 'Te avisamos antes de llegar al límite. Puedes subir de plan con un click o comprar mensajes adicionales por $5 cada 10,000.' },
]

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('omniflow_token')) {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#080812] text-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080812]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Wifi size={15} className="text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">OmniFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#canales"   className="hover:text-white transition-colors">Canales</a>
            <a href="#como"      className="hover:text-white transition-colors">Cómo funciona</a>
            <a href="#precios"   className="hover:text-white transition-colors">Precios</a>
            <a href="#faq"       className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-2">Entrar</Link>
            <Link href="/register">
              <button className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Empezar gratis <ChevronRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-16 px-6 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs text-violet-300 mb-7">
            <Zap size={11} className="fill-violet-400 text-violet-400" />
            Nuevo: Broadcasts masivos por WhatsApp · Instagram · Facebook
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-6">
            Tu negocio responde solo,{' '}
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              las 24 horas
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Conecta WhatsApp, Instagram, Facebook y más en un CRM con IA.
            El bot responde, califica leads y agenda — tú solo cierras ventas.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link href="/register">
              <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-2xl shadow-violet-500/25 text-sm">
                Empezar gratis 14 días <ArrowRight size={16} />
              </button>
            </Link>
            <a href="#como">
              <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-7 py-3.5 rounded-xl transition-all text-sm">
                Ver cómo funciona
              </button>
            </a>
          </div>

          {/* Trust line */}
          <p className="text-xs text-slate-600 mb-10">Sin tarjeta de crédito · Cancela cuando quieras · Setup en menos de 1 hora</p>

          {/* ── Dashboard mockup ── */}
          <div className="relative mx-auto max-w-4xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 to-purple-600/20 rounded-2xl blur-xl" />
            <div className="relative bg-[#0d0d1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0a0a16]">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="text-xs text-slate-600 ml-2">osw.conectaai.cl</span>
              </div>
              {/* Mock UI */}
              <div className="flex h-64 md:h-80">
                {/* Sidebar */}
                <div className="w-14 md:w-44 border-r border-white/5 flex flex-col gap-1 p-2 md:p-3">
                  {[
                    { label: 'Dashboard', active: false },
                    { label: 'Conversaciones', active: true },
                    { label: 'CRM', active: false },
                    { label: 'Broadcasts', active: false },
                    { label: 'Canales', active: false },
                  ].map(({ label, active }) => (
                    <div key={label} className={`px-2 py-1.5 rounded-lg text-xs hidden md:block ${active ? 'bg-violet-600/20 text-violet-300' : 'text-slate-600'}`}>
                      {label}
                    </div>
                  ))}
                </div>
                {/* Conversation list */}
                <div className="w-40 md:w-56 border-r border-white/5 overflow-hidden">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-white/5">Conversaciones · 24</div>
                  {[
                    { name: 'María González', msg: '¿Tienen stock del producto?', time: '2m', ch: '💬', unread: 2 },
                    { name: 'Carlos Ruiz',     msg: 'Quiero cotizar 50 unidades', time: '5m', ch: '📷', unread: 1 },
                    { name: 'Ana Martínez',    msg: 'Gracias por la info!',       time: '12m', ch: '💬', unread: 0 },
                    { name: 'Pedro Silva',     msg: '¿Cuándo llega el pedido?',   time: '1h', ch: '👥', unread: 0 },
                  ].map(({ name, msg, time, ch, unread }) => (
                    <div key={name} className="flex items-center gap-2 px-3 py-2.5 hover:bg-white/3 cursor-pointer border-b border-white/3">
                      <div className="w-7 h-7 rounded-full bg-violet-600/30 flex items-center justify-center text-xs font-bold text-violet-300 shrink-0">
                        {name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-300 truncate">{name}</span>
                          <span className="text-[10px] text-slate-600 shrink-0 ml-1">{time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px]">{ch}</span>
                          <p className="text-[10px] text-slate-600 truncate">{msg}</p>
                        </div>
                      </div>
                      {unread > 0 && (
                        <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center text-[9px] font-bold shrink-0">{unread}</div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Chat */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
                    <div className="w-6 h-6 rounded-full bg-violet-600/30 flex items-center justify-center text-xs font-bold text-violet-300">M</div>
                    <span className="text-xs font-medium text-white">María González</span>
                    <span className="text-[10px] text-green-400 ml-auto">● Bot activo</span>
                  </div>
                  <div className="flex-1 p-3 space-y-2 overflow-hidden">
                    <div className="flex justify-start">
                      <div className="bg-white/8 rounded-xl rounded-tl-sm px-3 py-1.5 text-xs text-slate-300 max-w-[75%]">¿Tienen stock del modelo XL?</div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-violet-600/40 rounded-xl rounded-tr-sm px-3 py-1.5 text-xs text-violet-100 max-w-[75%]">¡Hola María! Sí tenemos stock XL en negro y blanco. ¿Te envío el catálogo? 😊</div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white/8 rounded-xl rounded-tl-sm px-3 py-1.5 text-xs text-slate-300 max-w-[75%]">Sí por favor, y el precio</div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-violet-600/40 rounded-xl rounded-tr-sm px-3 py-1.5 text-xs text-violet-100 max-w-[75%]">Claro! XL está a $24.990. Te envío el link de pago directo 🛒</div>
                    </div>
                  </div>
                  <div className="px-3 pb-3">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                      <span className="text-xs text-slate-600 flex-1">Responder como humano…</span>
                      <div className="w-5 h-5 rounded-md bg-violet-600/40 flex items-center justify-center">
                        <ArrowRight size={10} className="text-violet-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="py-12 px-6 border-y border-white/5 bg-[#0a0a16]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Empresas activas',   to: 500,  suffix: '+' },
            { label: 'Mensajes/mes',        to: 2000, suffix: 'K+' },
            { label: 'Más conversiones',    to: 3,    suffix: '.2x' },
            { label: 'Tiempo de respuesta', to: 200,  suffix: 'ms' },
          ].map(({ label, to, suffix }) => (
            <div key={label}>
              <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent mb-1">
                <Counter to={to} suffix={suffix} />
              </div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Logos marquee ── */}
      <section className="py-10 px-6 overflow-hidden">
        <p className="text-center text-xs text-slate-600 uppercase tracking-widest mb-6">Integra con las plataformas que ya usas</p>
        <div className="flex gap-10 items-center justify-center flex-wrap">
          {LOGOS.map(({ name, src }) => (
            <div key={name} className="flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
              <img src={src} alt={name} width={40} height={40} className="object-contain" />
              <span className="text-[10px] text-slate-600">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Channels ── */}
      <section id="canales" className="py-20 px-6 bg-[#0a0a16]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-xs text-blue-300 mb-5">
              <MessageSquare size={11} /> Omnicanal real
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Todos tus canales, un solo lugar</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Sin copiar y pegar, sin cambiar de pestaña. Cada mensaje en un solo inbox.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CHANNELS.map(({ icon: Icon, name, desc, color }) => (
              <div key={name} className="group bg-[#0d0d1a] border border-white/5 rounded-2xl p-5 hover:border-white/10 hover:bg-[#0f0f22] transition-all cursor-default">
                <div className="text-2xl mb-3">
                  {typeof Icon === 'string' ? Icon : <Icon size={22} style={{ color }} />}
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">{name}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="como" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-xs text-amber-300 mb-5">
              <Zap size={11} /> Motor de automatización
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">De lead a venta en 3 pasos</h2>
            <p className="text-slate-400">Powered by n8n + IA. Sin código. Sin fricción.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01', color: '#25d366', title: 'Llega el mensaje',
                desc: 'WhatsApp, Instagram, Facebook o web. Todo entra al mismo inbox en tiempo real.',
                detail: 'WhatsApp → IA → CRM',
              },
              {
                step: '02', color: '#7c3aed', title: 'La IA lo analiza',
                desc: 'Detecta intención, califica el lead, responde automáticamente y actualiza el CRM.',
                detail: 'Score · Intención · Respuesta',
              },
              {
                step: '03', color: '#f59e0b', title: 'Tú cierras la venta',
                desc: 'Solo ves los leads calificados. El resto lo maneja el bot 24/7.',
                detail: 'Hot leads · Pipeline · $$$',
              },
            ].map(({ step, color, title, desc, detail }) => (
              <div key={step} className="relative bg-[#0d0d1a] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                <div className="text-4xl font-black mb-4 opacity-10" style={{ color }}>{step}</div>
                <div className="w-2 h-2 rounded-full mb-4" style={{ background: color }} />
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{desc}</p>
                <div className="text-xs font-mono px-3 py-1.5 rounded-lg w-fit" style={{ background: `${color}15`, color }}>
                  {detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 px-6 bg-[#0a0a16]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Todo lo que necesitas</h2>
            <p className="text-slate-400">Sin apps de terceros. Sin integraciones frágiles.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Bot,       color: '#7c3aed', title: 'IA Integrada',        desc: 'Calificación automática, detección de intención, respuestas sugeridas y análisis de sentimiento.' },
              { icon: Shield,    color: '#25d366', title: 'Multi-Tenant Seguro', desc: 'Cada empresa tiene su propia BD aislada. Datos encriptados en reposo y en tránsito.' },
              { icon: BarChart3, color: '#f59e0b', title: 'Analytics Tiempo Real', desc: 'Conversión por canal, fuentes de leads, tiempo de respuesta y rendimiento del bot en vivo.' },
              { icon: Users,     color: '#e1306c', title: 'Equipo Colaborativo', desc: 'Asigna conversaciones, roles por agente, notas internas y handoff bot→humano con un click.' },
              { icon: Zap,       color: '#2AABEE', title: 'n8n Sin Límites',     desc: 'Editor visual de flujos incluido. 400+ integraciones. Crea automatizaciones sin código.' },
              { icon: Globe,     color: '#96bf48', title: 'White-Label Total',   desc: 'Tu logo, tu dominio, tus colores. Ofrece la plataforma como servicio a tus propios clientes.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-[#0d0d1a] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                <div className="p-3 rounded-xl w-fit mb-4" style={{ background: `${color}15` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Lo que dicen nuestros clientes</h2>
            <p className="text-slate-400">Empresas reales, resultados reales.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text, stars, avatar }) => (
              <div key={name} className="bg-[#0d0d1a] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array(stars).fill(0).map((_, i) => (
                    <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed flex-1">"{text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {avatar}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{name}</div>
                    <div className="text-[10px] text-slate-500">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="precios" className="py-20 px-6 bg-[#0a0a16]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Planes simples, escalables</h2>
            <p className="text-slate-400">Comienza gratis. Crece sin sorpresas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, per, desc, features, cta, popular }) => (
              <div key={name} className={`relative flex flex-col bg-[#0d0d1a] border rounded-2xl p-6 transition-all ${popular ? 'border-violet-500/40 shadow-2xl shadow-violet-500/10 scale-[1.02]' : 'border-white/5 hover:border-white/10'}`}>
                {popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    ⭐ Más popular
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="font-bold text-white text-lg mb-1">{name}</h3>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-black text-white">${price}</span>
                  <span className="text-slate-500 text-sm mb-1">{per}</span>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <Check size={13} className="text-violet-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <button className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${popular ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}>
                    {cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-600 mt-6">
            Todos los planes incluyen 14 días de prueba · Sin tarjeta de crédito
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Preguntas frecuentes</h2>
            <p className="text-slate-400 text-sm">¿Tienes dudas? Te respondemos.</p>
          </div>
          <div className="space-y-2">
            {FAQS.map(({ q, a }) => <FaqItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-purple-900/10 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
            Empieza hoy,
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              resultados esta semana
            </span>
          </h2>
          <p className="text-slate-400 mb-9 text-lg">
            14 días gratis. Sin tarjeta. Sin trucos.
            Setup completo en menos de una hora.
          </p>
          <Link href="/register">
            <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-2xl shadow-violet-500/30 text-base mx-auto">
              Crear cuenta gratis <ArrowRight size={18} />
            </button>
          </Link>
          <p className="mt-4 text-xs text-slate-600">Más de 500 empresas ya automatizaron sus ventas con OmniFlow</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
                  <Wifi size={13} className="text-white" />
                </div>
                <span className="font-bold bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">OmniFlow</span>
              </div>
              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                Automatización omnicanal para empresas que quieren crecer sin contratar más equipo.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-xs text-slate-500">
              <div>
                <div className="font-semibold text-slate-400 mb-3">Producto</div>
                <div className="space-y-2">
                  <a href="#canales" className="block hover:text-slate-300 transition-colors">Canales</a>
                  <a href="#como" className="block hover:text-slate-300 transition-colors">Automatización</a>
                  <a href="#precios" className="block hover:text-slate-300 transition-colors">Precios</a>
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-400 mb-3">Legal</div>
                <div className="space-y-2">
                  <Link href="/privacy" className="block hover:text-slate-300 transition-colors">Privacidad</Link>
                  <Link href="/terms" className="block hover:text-slate-300 transition-colors">Términos</Link>
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-400 mb-3">Cuenta</div>
                <div className="space-y-2">
                  <Link href="/login" className="block hover:text-slate-300 transition-colors">Iniciar sesión</Link>
                  <Link href="/register" className="block hover:text-slate-300 transition-colors">Registrarse</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <span>© 2025 OmniFlow · Todos los derechos reservados</span>
            <span>Hecho con ❤️ en Chile 🇨🇱</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
