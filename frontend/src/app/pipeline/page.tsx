"use client";

import React, { useState, useEffect } from "react";
import { Plus, MoreHorizontal, DollarSign, User, TrendingUp, Filter } from "lucide-react";
import { useBranding } from "@/components/providers/BrandingProvider";
import api from "@/lib/api";

export default function PipelinePage() {
    const { branding } = useBranding();
    const [stages, setStages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPipeline = async () => {
        try {
            const res = await api.get("/crm/pipeline");
            setStages(res.data);
        } catch (err) {
            console.error("Fetch pipeline failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPipeline();
    }, []);

    const moveDeal = async (dealId: number, targetStageId: number) => {
        try {
            await api.patch(`/crm/deals/${dealId}/move?target_stage_id=${targetStageId}`);
            fetchPipeline();
        } catch (err) {
            console.error("Move failed", err);
        }
    };

    if (loading) return <div className="p-8 animate-pulse text-foreground/30">Loading pipeline...</div>;

    return (
        <div className="h-full flex flex-col max-w-[1400px] mx-auto w-full">
            {/* Header */}
            <div className="p-8 flex justify-between items-center bg-card/10 backdrop-blur-sm border-b border-border">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Sales Pipeline</h2>
                    <p className="text-foreground/50">Manage your deals and track conversion stages.</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-4 py-2 rounded-lg bg-white/5 border border-border flex items-center gap-2 hover:bg-white/10 transition-colors">
                        <Filter size={18} />
                        Filters
                    </button>
                    <button className="px-6 py-2 rounded-lg bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90 shadow-lg shadow-primary/20 transition-all">
                        <Plus size={18} />
                        Add Deal
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto p-8 flex gap-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
                {stages.map((stage) => (
                    <div key={stage.id} className="w-80 flex-shrink-0 flex flex-col">
                        {/* Stage Header */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm uppercase tracking-widest text-foreground/70">{stage.name}</h3>
                                <span className="bg-white/5 border border-border px-2 py-0.5 rounded-full text-[10px] font-mono">
                                    {stage.deals.length}
                                </span>
                            </div>
                            <MoreHorizontal size={18} className="text-foreground/30 cursor-pointer" />
                        </div>

                        {/* Deals List */}
                        <div className="flex-1 space-y-4 overflow-y-auto">
                            {stage.deals.map((deal: any) => (
                                <div
                                    key={deal.id}
                                    className="p-5 rounded-2xl bg-card border border-border glass hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-lg hover:shadow-primary/5 group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{deal.title || `Deal with ${deal.contact.name}`}</h4>
                                        <div className="px-1.5 py-0.5 rounded text-[8px] border border-emerald-500/30 text-emerald-500 bg-emerald-500/10 font-bold uppercase">
                                            {deal.status}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs text-foreground/50">
                                            <User size={14} className="text-primary/50" />
                                            {deal.contact.name}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1 text-emerald-500 font-bold">
                                                <DollarSign size={14} />
                                                {deal.value.toLocaleString()}
                                            </div>
                                            {deal.contact.lead_score > 70 && (
                                                <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold">
                                                    <TrendingUp size={12} />
                                                    PRIME
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Shortcuts (Hidden by default) */}
                                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => moveDeal(deal.id, stage.id + 1)}
                                            className="flex-1 py-1 rounded-md bg-white/5 text-[10px] font-bold hover:bg-primary hover:text-white transition-all shadow-sm"
                                        >
                                            Next Stage
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Empty State placeholder for stage */}
                            {stage.deals.length === 0 && (
                                <div className="h-32 rounded-2xl border-2 border-dashed border-border/50 flex items-center justify-center text-foreground/20 italic text-xs">
                                    Drop deals here
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Add New Stage Placeholder */}
                <div className="w-80 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-border/30 rounded-3xl h-fit py-12 text-foreground/30 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                    <div className="text-center space-y-2">
                        <Plus className="mx-auto" size={24} />
                        <span className="text-sm font-bold uppercase tracking-wider">Add Stage</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
