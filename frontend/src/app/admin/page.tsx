"use client";

import React, { useState, useEffect } from "react";
import { Shield, Users, Server, HardDrive, DollarSign, Activity, ChevronRight, Search } from "lucide-react";
import api from "@/lib/api";

export default function AdminDashboard() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [stats, setStats] = useState({ total_revenue: 12500, active_tenants: 0, server_health: 98 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get("/admin/tenants");
                setTenants(res.data);
                setStats(s => ({ ...s, active_tenants: res.data.length }));
            } catch (err) {
                console.error("Failed to fetch admin data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-primary animate-pulse font-mono uppercase tracking-widest">System Accessing...</div>;

    return (
        <div className="p-8 space-y-8 min-h-screen bg-black text-white selection:bg-primary/30 max-w-7xl mx-auto">
            {/* Admin Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary animate-pulse">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic">Control <span className="text-primary">Center</span></h1>
                        <p className="text-white/40 text-xs font-mono tracking-widest uppercase">Global SaaS Orchestration Layer</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">System Status</div>
                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            OPERATIONAL
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AdminStatCard title="Active Segments" value={stats.active_tenants} icon={Server} trend="+5" color="border-blue-500/30" />
                <AdminStatCard title="Global Revenue" value={`$${stats.total_revenue}`} icon={DollarSign} trend="+$1.2k" color="border-primary/30" />
                <AdminStatCard title="Node Health" value={`${stats.server_health}%`} icon={Activity} trend="STABLE" color="border-emerald-500/30" />
            </div>

            {/* Tenant Orchestrator */}
            <div className="rounded-3xl bg-white/[0.02] border border-white/10 overflow-hidden backdrop-blur-3xl shadow-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                        <Users size={20} className="text-primary" />
                        <h2 className="text-lg font-bold uppercase tracking-wider">Tenant Orchestrator</h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                        <input
                            type="text"
                            placeholder="SEARCH BY UUID OR NAMESPACE..."
                            className="bg-black/40 border border-white/10 rounded-full py-2 pl-10 pr-4 text-[10px] font-mono w-64 focus:border-primary outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.02] text-[10px] font-mono text-white/40 uppercase tracking-widest">
                                <th className="p-4 pl-8">Namespace</th>
                                <th className="p-4">Subdomain</th>
                                <th className="p-4">Plan Tier</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Deployment Date</th>
                                <th className="p-4 pr-8 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tenants.map((t) => (
                                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4 pl-8">
                                        <div className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors cursor-pointer">{t.name}</div>
                                        <div className="text-[9px] font-mono text-white/30 uppercase mt-1">ID: T-{t.id.toString().padStart(4, '0')}</div>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-blue-400">{t.subdomain}.omniflow.io</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${t.plan === 'Enterprise' ? 'bg-primary/20 text-primary border border-primary/30' :
                                            t.plan === 'Pro' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                'bg-white/10 text-white/60 border border-white/10'
                                            }`}>
                                            {t.plan}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            <span className="text-[10px] font-bold uppercase">{t.is_active ? 'Online' : 'Suspended'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs font-mono text-white/40">{new Date(t.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 pr-8 text-right">
                                        <button className="p-2 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary transition-all">
                                            <ChevronRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-white/10 bg-black/40 text-center">
                    <button className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest hover:underline">
                        Deploy New Global Instance +
                    </button>
                </div>
            </div>
        </div>
    );
}

function AdminStatCard({ title, value, icon: Icon, trend, color }: any) {
    return (
        <div className={`p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex items-center justify-between group hover:bg-white/[0.04] transition-all cursor-crosshair ${color}`}>
            <div className="space-y-1">
                <p className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em]">{title}</p>
                <div className="text-3xl font-black tracking-tighter">{value}</div>
                <p className="text-[10px] font-mono text-emerald-500">{trend}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 text-white/20 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                <Icon size={32} />
            </div>
        </div>
    );
}
