"use client";

import React, { useState } from "react";
import { useBranding } from "@/components/providers/BrandingProvider";
import { Save, Upload, Palette, Globe, Mail, Phone } from "lucide-react";
import { updateSettings } from "@/lib/api";

export default function SettingsPage() {
    const { branding } = useBranding();
    const [logoUrl, setLogoUrl] = useState(branding?.settings?.logo_url || "");
    const [primaryColor, setPrimaryColor] = useState(branding?.settings?.primary_color || "#3b82f6");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSettings({
                logo_url: logoUrl,
                primary_color: primaryColor,
            });
            // Reload or update branding state
            window.location.reload();
        } catch (error) {
            console.error("Save failed", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">White Label Settings</h2>
                <p className="text-foreground/50">Personalize your SaaS instance with your own branding.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visual Branding */}
                <div className="p-6 rounded-2xl bg-card border border-border glass space-y-6">
                    <div className="flex items-center gap-3 text-lg font-semibold border-b border-border pb-4">
                        <Palette size={20} className="text-primary" />
                        Visual Identity
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/70">Logo URL</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={logoUrl}
                                    onChange={(e) => setLogoUrl(e.target.value)}
                                    placeholder="https://example.com/logo.png"
                                    className="flex-1 bg-white/5 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <button className="p-2 rounded-lg bg-white/5 border border-border hover:bg-white/10">
                                    <Upload size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/70">Primary Color</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                                />
                                <div className="flex-1 text-sm font-mono bg-white/5 border border-border rounded-lg px-3 py-2">
                                    {primaryColor}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="p-6 rounded-2xl bg-card border border-border glass space-y-6">
                    <div className="flex items-center gap-3 text-lg font-semibold border-b border-border pb-4">
                        <Globe size={20} className="text-emerald-500" />
                        Preview
                    </div>
                    <div className="p-8 rounded-xl bg-background border border-border flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="h-12 flex items-center justify-center">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Preview" className="max-h-full" />
                            ) : (
                                <span className="text-xl font-bold" style={{ color: primaryColor }}>{branding?.name || "OmniFlow"}</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="w-32 h-8 rounded-lg animate-pulse mx-auto" style={{ backgroundColor: primaryColor + '44' }} />
                            <div className="w-24 h-4 rounded-lg bg-white/5 animate-pulse mx-auto" />
                        </div>
                        <button
                            className="px-6 py-2 rounded-lg text-white font-medium text-sm transition-opacity"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Action Button
                        </button>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="p-6 rounded-2xl bg-card border border-border glass space-y-6 md:col-span-2">
                    <div className="flex items-center gap-3 text-lg font-semibold border-b border-border pb-4">
                        <Mail size={20} className="text-blue-500" />
                        Support & Contact
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/70">Support Email</label>
                            <div className="flex items-center gap-3 bg-white/5 border border-border rounded-lg px-3 py-2">
                                <Mail size={16} className="text-foreground/30" />
                                <input type="email" placeholder="support@company.com" className="bg-transparent border-none focus:outline-none text-sm w-full" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/70">WhatsApp Support</label>
                            <div className="flex items-center gap-3 bg-white/5 border border-border rounded-lg px-3 py-2">
                                <Phone size={16} className="text-foreground/30" />
                                <input type="text" placeholder="+1234567890" className="bg-transparent border-none focus:outline-none text-sm w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 rounded-xl bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                >
                    <Save size={20} />
                    {saving ? "Saving Changes..." : "Save Branding"}
                </button>
            </div>
        </div>
    );
}
