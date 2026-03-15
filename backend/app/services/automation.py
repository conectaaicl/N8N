import httpx
from app.models.core import TenantSettings

async def trigger_n8n_workflow(settings: TenantSettings, payload: dict):
    """
    Sends a payload to a tenant's n8n webhook.
    """
    if not settings.n8n_url or not settings.n8n_webhook_path:
        return None
        
    url = f"{settings.n8n_url.rstrip('/')}/{settings.n8n_webhook_path.lstrip('/')}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error triggering n8n workflow: {e}")
            return None
