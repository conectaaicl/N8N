"use client";

import React, { useState, useEffect } from "react";
import {
    Users,
    Target,
    TrendingUp,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Calendar,
    Layers
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from "recharts";
import api from "@/lib/api";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get("/tenants/dashboard-stats");
                setData(res.data);
            } catch (err) {
                console.error("Dashboard fetch failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 animate-pulse text-foreground/30">Cargando analíticas...</div>;

    const stats = data?.stats || { total_contacts: 0, hot_leads: 0, total_deals: 0, conversion_rate: 0 };
    const sourceData = data?.source_distribution || [];

    return (
        <div className="p-8 space-y-8 pb-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Panel de Control</h2>
                    <p className="text-foreground/50">Resumen en tiempo real de tu rendimiento de ventas.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-border text-xs font-medium cursor-pointer hover:bg-white/10 transition-colors">
                        <Calendar size={14} />
                        Últimos 30 Días
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                        <Filter size={14} />
                        Filtros Personalizados
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Leads Totales"
                    value={stats.total_contacts}
                    icon={Users}
                    trend="+12%"
                    isUp={true}
                    subtitle="vs mes anterior"
                />
                <StatCard
                    title="Alta Intención"
                    value={stats.hot_leads}
                    icon={Target}
                    trend="+5%"
                    isUp={true}
                    subtitle="Leads con puntuación > 70"
                    color="text-red-500"
                />
                <StatCard
                    title="Negocios Activos"
                    value={stats.total_deals}
                    icon={Layers}
                    trend="-2%"
                    isUp={false}
                    subtitle="Pipeline actual"
                    color="text-amber-500"
                />
                <StatCard
                    title="Tasa Conv."
                    value={`${stats.conversion_rate.toFixed(1)}%`}
                    icon={TrendingUp}
                    trend="+3%"
                    isUp={true}
                    subtitle="Leads a Ganados"
                    color="text-emerald-500"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Source Distribution */}
                <div className="p-6 rounded-3xl bg-card border border-border glass space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Leads por Origen</h3>
                        <div className="text-[10px] uppercase font-bold text-foreground/30 tracking-widest">Distribución Omni-canal</div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sourceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="source"
                                >
                                    {sourceData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                        {sourceData.map((item: any, i: number) => (
                            <div key={item.source} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-[10px] font-bold uppercase text-foreground/50">{item.source}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance Trend (Mock Data for Visual) */}
                <div className="p-6 rounded-3xl bg-card border border-border glass space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Tendencia de Rendimiento</h3>
                        <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                            <TrendingUp size={14} />
                            +18% Mejorado
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockTrendData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#666' }} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#666' }} />
                                <Tooltip
                                    label="Día"
                                    contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '12px' }}
                                />
                                <Area type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" stackId="1" name="Leads" />
                                <Area type="monotone" dataKey="deals" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="rgba(16, 185, 129, 0.1)" stackId="2" name="Negocios" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, trend, isUp, subtitle, color = "text-primary" }: any) {
    return (
        <div className="p-6 rounded-3xl bg-card border border-border glass relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-white/5 border border-border ${color} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold ${isUp ? 'text-emerald-500' : 'text-red-500'} bg-white/5 px-2 py-1 rounded-full`}>
                    {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {trend}
                </div>
            </div>
            <div className="space-y-1">
                <h4 className="text-foreground/50 text-[10px] uppercase font-bold tracking-widest leading-none">{title}</h4>
                <div className="text-3xl font-black">{value}</div>
                <p className="text-[10px] text-foreground/30 font-medium">{subtitle}</p>
            </div>
            {/* Subtle background gradient on hover */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
        </div>
    );
}

const mockTrendData = [
    { name: 'Mon', leads: 40, deals: 24 },
    { name: 'Tue', leads: 30, deals: 13 },
    { name: 'Wed', leads: 20, deals: 98 },
    { name: 'Thu', leads: 27, deals: 39 },
    { name: 'Fri', leads: 18, deals: 48 },
    { name: 'Sat', leads: 23, deals: 38 },
    { name: 'Sun', leads: 34, deals: 43 },
];
