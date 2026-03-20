'use client'

import { useEffect, useState } from 'react'

export default function WebChatPreview() {
  const [subdomain, setSubdomain] = useState<string>('osw')
  const [origin, setOrigin] = useState<string>('https://osw.conectaai.cl')

  useEffect(() => {
    setOrigin(window.location.origin)
    const cached = localStorage.getItem('omniflow_user')
    // Settings page stores tenant_subdomain; fallback to user email prefix
    const settings = localStorage.getItem('omniflow_settings')
    if (settings) {
      try { const s = JSON.parse(settings); if (s.tenant_subdomain) setSubdomain(s.tenant_subdomain) } catch { /* */ }
    } else if (cached) {
      try {
        const u = JSON.parse(cached)
        // email prefix as last-resort fallback
        if (u.email) setSubdomain(u.email.split('@')[0])
      } catch { /* */ }
    }
  }, [])

  useEffect(() => {
    if (!subdomain) return
    const s = document.createElement('script')
    s.src = '/widget.js'
    s.setAttribute('data-tenant', subdomain)
    document.body.appendChild(s)
    return () => {
      try { document.body.removeChild(s) } catch { /* */ }
      const btn = document.getElementById('omniflow-btn')
      const panel = document.getElementById('omniflow-panel')
      if (btn) document.body.removeChild(btn)
      if (panel) document.body.removeChild(panel)
    }
  }, [subdomain])

  const embedCode = `<script\n  src="${origin}/widget.js"\n  data-tenant="${subdomain}">\n</script>`

  return (
    <div className="min-h-screen bg-[#080812] flex items-center justify-center p-8">
      <div className="text-center max-w-lg w-full">
        <div className="text-4xl mb-4">💬</div>
        <h1 className="text-2xl font-bold text-white mb-3">Web Chat Widget Preview</h1>
        <p className="text-slate-400 mb-6">El widget de chat flotante está activo en la esquina inferior derecha.</p>
        <div className="bg-[#0d0d1a] border border-white/5 rounded-2xl p-5 text-left space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-semibold">Código para tu sitio web:</p>
            <span className="text-xs text-violet-400 font-mono">{subdomain}</span>
          </div>
          <pre className="text-xs text-violet-300 font-mono overflow-x-auto whitespace-pre-wrap break-all bg-black/30 p-3 rounded-lg">
            {embedCode}
          </pre>
          <p className="text-xs text-slate-600">Pega este código antes de <code className="text-slate-400">&lt;/body&gt;</code> en tu sitio web.</p>
        </div>
      </div>
    </div>
  )
}
