"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPublicInfo } from '@/lib/api';

interface Branding {
    name: string;
    subdomain: string;
    settings: {
        logo_url: string | null;
        primary_color: string;
        favicon_url: string | null;
    };
}

interface BrandingContextType {
    branding: Branding | null;
    loading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
    branding: null,
    loading: true,
});

export const BrandingProvider = ({ children }: { children: React.ReactNode }) => {
    const [branding, setBranding] = useState<Branding | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const host = window.location.host;
                const data = await getPublicInfo(host);
                setBranding(data);

                // Apply primary color to CSS variable
                if (data.settings?.primary_color) {
                    // Check if it's a hex or hsl
                    const color = data.settings.primary_color;
                    document.documentElement.style.setProperty('--primary', color);
                    // We might need to calculate foreground etc, but for now just the primary
                }

            } catch (error) {
                console.error("Failed to fetch branding:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBranding();
    }, []);

    return (
        <BrandingContext.Provider value={{ branding, loading }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => useContext(BrandingContext);
