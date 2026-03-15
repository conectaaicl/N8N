"use client";

import React from "react";
import { BrandingProvider, useBranding } from "@/components/providers/BrandingProvider";
import { LogOut, LayoutDashboard, MessageSquare, Zap, BarChart3, Settings, Target, Shield, DollarSign, CreditCard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SidebarLink = ({ icon: Icon, label, href, active = false }: { icon: any, label: string, href: string, active?: boolean }) => (
    <Link href={href}>
        <div className={`px-3 py-2 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${active ? "bg-primary/10 text-primary font-medium" : "hover:bg-white/5 text-foreground/70"
            }`}>
            {active && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
            <Icon size={18} />
            {label}
        </div>
    </Link>
);

const UserProfile = () => (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
            JD
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-foreground/50 truncate">White Label Admin</p>
        </div>
    </div>
);

export const DashboardShell = ({ children }: { children: React.ReactNode }) => {
    const { branding, loading } = useBranding();
    const pathname = usePathname();

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-md flex flex-col">
                <div className="p-6 border-b border-border">
                    {branding?.settings?.logo_url ? (
                        <img src={branding.settings.logo_url} alt={branding.name} className="h-8 w-auto object-contain" />
                    ) : (
                        <h1 className="text-2xl font-bold premium-gradient bg-clip-text text-transparent">
                            {branding?.name || "OmniFlow"}
                        </h1>
                    )}
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <SidebarLink icon={LayoutDashboard} label="Dashboard" href="/" active={pathname === "/"} />
                    <SidebarLink icon={MessageSquare} label="Conversaciones" href="/conversations" active={pathname === "/conversations"} />
                    <SidebarLink icon={Target} label="Pipeline de Ventas" href="/pipeline" active={pathname === "/pipeline"} />
                    <SidebarLink icon={CreditCard} label="Suscripción" href="/settings/billing" active={pathname === "/settings/billing"} />
                    <SidebarLink icon={Zap} label="Automatizaciones" href="/automations" active={pathname === "/automations"} />
                    <SidebarLink icon={Settings} label="Integraciones" href="/settings/integrations" active={pathname === "/settings/integrations"} />
                    <SidebarLink icon={Shield} label="Administración" href="/admin" active={pathname === "/admin"} />
                </nav>
                <div className="p-4 border-t border-border space-y-4">
                    <UserProfile />
                    <button className="w-full px-3 py-2 rounded-lg flex items-center gap-3 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-medium">
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background border-l border-border">
                <div className="max-w-[1600px] mx-auto min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default function ShellWithBranding({ children }: { children: React.ReactNode }) {
    return (
        <BrandingProvider>
            <DashboardShell>{children}</DashboardShell>
        </BrandingProvider>
    );
}
