"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Check, Zap, Crown, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import api from "@/lib/api";

const PLANS = [
    {
        id: 1,
        name: "Starter",
        price: 29,
        description: "Perfect for small businesses starting their automation journey.",
        features: ["1,000 Contacts", "5,000 Messages/mo", "Basic AI Intent", "WhatsApp Integration"],
        color: "bg-blue-500/10 text-blue-500"
    },
    {
        id: 2,
        name: "Pro",
        price: 99,
        description: "Scale your sales with advanced AI and higher limits.",
        features: ["10,000 Contacts", "50,000 Messages/mo", "Advanced AI Scoring", "n8n Automation Builder", "Priority Support"],
        color: "bg-primary/20 text-primary",
        popular: true
    },
    {
        id: 3,
        name: "Enterprise",
        price: 299,
        description: "Full orchestration for large scale operations.",
        features: ["Unlimited Contacts", "Unlimited Messages", "Custom AI Models", "Dedicated Support", "White-Label Reseller Option"],
        color: "bg-emerald-500/10 text-emerald-500"
    }
];

export default function BillingPage() {
    const [currentSub, setCurrentSub] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);

    useEffect(() => {
        const fetchSub = async () => {
            try {
                const res = await api.get("/billing/current");
                setCurrentSub(res.data);
            } catch (err) {
                console.error("Billing fetch failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSub();
    }, []);

    const handleSubscribe = async (planId: number) => {
        setProcessing(planId);
        try {
            await api.post(`/billing/subscribe/${planId}`);
            const res = await api.get("/billing/current");
            setCurrentSub(res.data);
        } catch (err) {
            console.error("Subscription failed", err);
        } finally {
            setProcessing(null);
        }
    };

    if (loading) return <div className="p-8 text-foreground/30 animate-pulse font-bold tracking-tighter uppercase">Encrypting Billing Data...</div>;

    return (
        <div className="p-8 space-y-12 max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-black tracking-tight uppercase italic">Subscription <span className="text-primary">& Plans</span></h2>
                <p className="text-foreground/50 max-w-2xl mx-auto">Choose the tier that best fits your business orchestration needs. Upgrade or downgrade anytime.</p>
            </div>

            {/* Current Status */}
            <div className="p-6 rounded-3xl bg-card border border-border glass flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 mb-1">Current Plan Status</div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold">{currentSub?.plan || "No Active Plan"}</h3>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase">Active</span>
                        </div>
                        {currentSub?.current_period_end && (
                            <p className="text-xs text-foreground/40 mt-1">Renews on {new Date(currentSub.current_period_end).toLocaleDateString()}</p>
                        )}
                    </div>
                </div>
                <button className="px-6 py-2 rounded-xl bg-white/5 border border-border text-xs font-bold hover:bg-white/10 transition-all">
                    Manage Payment Method
                </button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PLANS.map((plan) => (
                    <div
                        key={plan.id}
                        className={`p-8 rounded-[2.5rem] bg-card border ${plan.popular ? 'border-primary shadow-2xl shadow-primary/10 scale-105' : 'border-border'} glass flex flex-col relative overflow-hidden group`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black uppercase px-4 py-2 rounded-bl-2xl">
                                MOst Popular
                            </div>
                        )}

                        <div className="space-y-4 mb-8">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${plan.color}`}>
                                {plan.name} Tier
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black tracking-tighter italic">${plan.price}</span>
                                <span className="text-foreground/30 text-sm font-bold uppercase tracking-widest">/mo</span>
                            </div>
                            <p className="text-xs text-foreground/50 leading-relaxed font-semibold">{plan.description}</p>
                        </div>

                        <div className="flex-1 space-y-4 mb-8">
                            {plan.features.map((feature, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs font-semibold">
                                    <Check size={14} className="text-emerald-500 mt-0.5" />
                                    {feature}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => handleSubscribe(plan.id)}
                            disabled={currentSub?.plan === plan.name || processing !== null}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${currentSub?.plan === plan.name
                                    ? 'bg-white/5 border border-border text-white/30 cursor-default'
                                    : 'bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/20 active:scale-95'
                                }`}
                        >
                            {processing === plan.id ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : currentSub?.plan === plan.name ? (
                                "Current Plan"
                            ) : (
                                <>
                                    Acquire License
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
