from app.services.ai import analyze_message_intent, calculate_lead_score

def ingest_lead(db: Session, lead_data: dict, tenant_id: int):
    """
    Ingests a lead from various sources (FB, Web, TikTok, etc.)
    """
    # AI Analysis
    message_content = lead_data.get("message", "")
    intent = analyze_message_intent(message_content)
    score = calculate_lead_score(message_content, lead_data.get("source", "web"))
    
    # Find or create contact
    phone = lead_data.get("phone")
    email = lead_data.get("email")
    
    contact = None
    if phone:
        contact = db.query(Contact).filter(Contact.phone == phone).first()
    elif email:
        contact = db.query(Contact).filter(Contact.email == email).first()
        
    if not contact:
        contact = Contact(
            name=lead_data.get("name", "Unknown"),
            phone=phone,
            email=email,
            source=lead_data.get("source"),
            campaign=lead_data.get("campaign"),
            lead_score=score,
            intent=intent
        )
        db.add(contact)
        db.flush()
    else:
        # Update existing contact with new interaction
        contact.lead_score = max(contact.lead_score, score)
        contact.intent = intent
        contact.last_interaction = datetime.utcnow()
    
    # Create or update conversation
    conversation = db.query(Conversation).filter(
        Conversation.contact_id == contact.id,
        Conversation.channel == lead_data.get("source")
    ).first()
    
    if not conversation:
        conversation = Conversation(
            contact_id=contact.id,
            channel=lead_data.get("source"),
            status="open"
        )
        db.add(conversation)
        db.flush()
        
    # If there's a message content, save it
    if lead_data.get("message"):
        message = Message(
            conversation_id=conversation.id,
            sender_type="contact",
            content=lead_data.get("message"),
            timestamp=datetime.utcnow()
        )
        db.add(message)
        conversation.last_message = lead_data.get("message")
        conversation.updated_at = datetime.utcnow()
        
    db.commit()
    return contact, conversation

def handle_incoming_message(db: Session, message_data: dict, tenant_id: int):
    """
    Handles a message from an existing channel (WhatsApp, Instagram...)
    """
    # This is similar to ingest_lead but focused on ongoing conversations
    # For now, let's use ingest_lead as the base
    return ingest_lead(db, message_data, tenant_id)
