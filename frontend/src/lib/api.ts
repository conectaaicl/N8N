import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
});

// Mock Interceptor for Demo
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config } = error;
        console.warn(`Backend unreachable at ${config.url}, providing mock data...`);

        // Mock data logic based on URL
        if (config.url?.includes('/tenants/public-info')) {
            return { data: { name: 'OmniFlow Demo', settings: { primary_color: '#0066FF', logo_url: '' } } };
        }
        if (config.url?.includes('/admin/tenants')) {
            return {
                data: [
                    { id: 1, name: 'Acme Corp', subdomain: 'acme', is_active: true, plan: 'Enterprise', created_at: new Date().toISOString() },
                    { id: 2, name: 'Global Sales', subdomain: 'global', is_active: true, plan: 'Pro', created_at: new Date().toISOString() },
                    { id: 3, name: 'StartUp Inc', subdomain: 'startup', is_active: false, plan: 'Free', created_at: new Date().toISOString() },
                ]
            };
        }
        if (config.url?.includes('/billing/current')) {
            return { data: { plan: 'Pro', status: 'active', current_period_end: new Date(Date.now() + 86400000 * 25).toISOString() } };
        }
        if (config.url?.includes('/crm/pipeline')) {
            return {
                data: [
                    { id: 1, name: 'Lead', order: 0, deals: [{ id: 101, title: 'Big Deal', value: 5000, contact: { name: 'Alice', lead_score: 85 } }] },
                    { id: 2, name: 'Contacted', order: 1, deals: [] },
                    { id: 3, name: 'Closing', order: 2, deals: [{ id: 102, title: 'SaaS Plan', value: 1200, contact: { name: 'Bob', lead_score: 92 } }] }
                ]
            };
        }
        if (config.url?.includes('/dashboard-stats')) {
            return { data: { total_contacts: 1250, hot_leads: 45, total_deals: 12, conversion_rate: 8.5, lead_sources: { whatsapp: 450, web: 300, instagram: 500 } } };
        }

        return Promise.reject(error);
    }
);

export const getPublicInfo = async (host: string) => {
    const response = await api.get(`/tenants/public-info`, {
        headers: {
            'host': host,
        }
    });
    return response.data;
};

export const updateSettings = async (settings: any) => {
    const response = await api.patch(`/tenants/settings`, settings);
    return response.data;
};

export default api;
