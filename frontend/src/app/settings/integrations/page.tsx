"use client";

import React from "react";
import { Facebook, Instagram, Globe, Music, CheckCircle2, AlertCircle, Plus } from "lucide-react";

const CHANNELS = [
    { id: "whatsapp", name: "WhatsApp Business", icon: Globe, status: "connected", description: "Mensajería directa vía API Oficial." },
    { id: "facebook", name: "Facebook Messenger", icon: Facebook, status: "pending", description: "Integración con páginas de fans." },
    { id: "instagram", name: "Instagram DMs", icon: Instagram, status: "connected", description: "Gestión de mensajes y comentarios." },
    { id: "web", name: "Web Chat Widget", icon: Globe, status: "connected", description: "Burbuja de chat para tu sitio web." },
    { id: "spotify", name: "Spotify Ads/API", icon: Music, status: "disconnected", description: "Seguimiento de conversiones y anuncios." }
];

export default function IntegrationsPage() {
    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Canales e Integraciones</h2>
                <p className="text-foreground/50">Conecta tu ecosistema digital para una orquestación centralizada.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CHANNELS.map((channel) => (
                    <div key={channel.id} className="p-6 rounded-3xl bg-card border border-border glass hover:border-primary/50 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 rounded-2xl bg-white/5 border border-border text-primary group-hover:scale-110 transition-transform">
                                <channel.icon size={24} />
                            </div>
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase ${channel.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500' :
                                    channel.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-foreground/30'
                                }`}>
                                {channel.status === 'connected' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                {channel.status === 'connected' ? 'Conectado' : channel.status === 'pending' ? 'Pendiente' : 'Desconectado'}
                            </div>
                        </div>
                        <h3 className="text-lg font-bold mb-2">{channel.name}</h3>
                        <p className="text-xs text-foreground/50 mb-6 leading-relaxed">{channel.description}</p>
                        <button className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${channel.status === 'connected' ? 'bg-white/5 border border-border hover:bg-white/10' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90'
                            }`}>
                            {channel.status === 'connected' ? 'Configurar' : 'Conectar Ahora'}
                        </button>
                    </div>
                ))}

                <div className="p-6 rounded-3xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-center space-y-3 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
                    <div className="p-3 rounded-full bg-white/5">
                        <Plus size={24} className="text-foreground/30" />
                    </div>
                    <div>
                        <div className="font-bold text-sm">Nueva Integración</div>
                        <div className="text-[10px] text-foreground/30 uppercase mt-1">API Personalizada / Webhook</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
