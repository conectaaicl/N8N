import re

def analyze_message_intent(content: str) -> str:
    """
    Classifies the intent of a message using simple heuristics.
    In production, this would use an LLM (OpenAI/Anthropic).
    """
    content = content.lower()
    
    if any(word in content for word in ["precio", "costo", "cuanto vale", "valor", "$"]):
        return "pricing_inquiry"
    if any(word in content for word in ["info", "informacion", "detalle", "saber mas"]):
        return "info_request"
    if any(word in content for word in ["demo", "probar", "agendar", "reunion"]):
        return "demo_request"
    if any(word in content for word in ["comprar", "quiero el", "listo para"]):
        return "purchase_intent"
    
    return "general_query"

def calculate_lead_score(content: str, source: str) -> int:
    """
    Calculates a lead score based on content and source.
    """
    score = 0
    content = content.lower()
    
    # Source multipliers
    source_weights = {
        "whatsapp": 20,
        "web": 15,
        "instagram": 10,
        "facebook": 5,
        "tiktok": 5
    }
    score += source_weights.get(source, 0)
    
    # Content signals
    if "comprar" in content or "pago" in content:
        score += 50
    if "precio" in content:
        score += 20
    if len(content) > 50: # Longer messages usually indicate higher intent
        score += 10
        
    return min(score, 100)
