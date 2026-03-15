"use client";

import React, { useState } from "react";
import { Zap, Plus, Play, Trash2, Edit3, Settings, ExternalLink } from "lucide-react";

const MOCK_WORKFLOWS = [
    { id: 1, name: "Bienvenida WhatsApp", status: "active", last_run: "Hace 5 mins", trigger: "Nuevo Mensaje" },
    { id: 2, name: "Cualificación AI", status: "active", last_run: "Hace 1 hora", trigger: "Lead Score > 70" },
    { id: 3, name: "Seguimiento Automático", status: "paused", last_run: "Ayer", trigger: "Sin respuesta 24h" }
];

export default function AutomationsPage() {
    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Automatizaciones</h2>
                    <p className="text-foreground/50">Orquestación de flujos de trabajo inteligentes con n8n.</p>
                </div>
                <button className="px-6 py-2 rounded-lg bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                    <Plus size={18} />
                    Crear Flujo
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {MOCK_WORKFLOWS.map((wf) => (
                    <div key={wf.id} className="p-6 rounded-2xl bg-card border border-border glass flex items-center justify-between hover:border-primary/50 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${wf.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-foreground/30'}`}>
                                <Zap size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold">{wf.name}</h3>
                                <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-foreground/30 tracking-widest mt-1">
                                    <span>Gatillo: {wf.trigger}</span>
                                    <span>•</span>
                                    <span>Última ejecución: {wf.last_run}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-foreground/50">
                                <Play size={18} />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-foreground/50">
                                <Edit3 size={18} />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-red-500/50 hover:text-red-500">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* n8n Integration Card */}
            <div className="p-8 rounded-3xl bg-primary/10 border border-primary/20 mt-12 relative overflow-hidden group">
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <img src="https://n8n.io/images/n8n-logo.svg" className="h-6" alt="n8n" />
                        <h3 className="text-xl font-bold">Motor de n8n Conectado</h3>
                    </div>
                    <p className="text-sm text-foreground/70 max-w-xl">
                        Tu instancia de n8n está lista para procesar flujos complejos. Puedes crear webhooks personalizados y conectar más de 400 aplicaciones.
                    </p>
                    <button className="flex items-center gap-2 text-primary font-bold text-sm hover:underline">
                        Abrir n8n Engine
                        <ExternalLink size={14} />
                    </button>
                </div>
                <Zap className="absolute -right-10 -bottom-10 text-primary/5 w-64 h-64 group-hover:scale-110 transition-transform" />
            </div>
        </div>
    );
}
