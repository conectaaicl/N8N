'use client'

import { useEffect } from 'react'

export default function WebChatPreview() {
  useEffect(() => {
    const s = document.createElement('script')
    s.src = '/widget.js'
    s.setAttribute('data-tenant', 'osw')
    document.body.appendChild(s)
    return () => { document.body.removeChild(s) }
  }, [])

  return (
    <div className="min-h-screen bg-[#080812] flex items-center justify-center p-8">
      <div className="text-center max-w-lg">
        <div className="text-4xl mb-4">💬</div>
        <h1 className="text-2xl font-bold text-white mb-3">Web Chat Widget Preview</h1>
        <p className="text-slate-400 mb-6">El widget de chat flotante está activo en la esquina inferior derecha.</p>
        <div className="bg-[#0d0d1a] border border-white/5 rounded-2xl p-5 text-left space-y-3">
          <p className="text-xs text-slate-400 font-semibold">Código para tu sitio web:</p>
          <pre className="text-xs text-violet-300 font-mono overflow-x-auto whitespace-pre-wrap break-all bg-black/30 p-3 rounded-lg">
{`<script
  src="https://osw.conectaai.cl/widget.js"
  data-tenant="osw">
</script>`}
          </pre>
          <p className="text-xs text-slate-600">Pega este código antes de <code className="text-slate-400">&lt;/body&gt;</code> en tu sitio web.</p>
        </div>
      </div>
    </div>
  )
}
