from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db, tenant_db_session
from app.models.core import Tenant
from app.models.tenant import Pipeline, PipelineStage, Deal, Contact
from typing import List

router = APIRouter()

@router.get("/pipeline")
def get_pipeline(db: Session = Depends(get_db)):
    """
    Returns the current pipeline with its stages and deals.
    """
    tenant = db.query(Tenant).first()
    with tenant_db_session(tenant.schema_name) as tenant_db:
        # Get the first pipeline (multi-pipeline support later)
        pipeline = tenant_db.query(Pipeline).first()
        if not pipeline:
            # Create default if none exists
            pipeline = Pipeline(name="Default Sales")
            tenant_db.add(pipeline)
            tenant_db.commit()
            tenant_db.refresh(pipeline)
            
            # Add default stages
            stages = ["Lead", "Contacted", "Proposal", "Negotiation", "Won", "Lost"]
            for i, name in enumerate(stages):
                stage = PipelineStage(pipeline_id=pipeline.id, name=name, order=i)
                tenant_db.add(stage)
            tenant_db.commit()
            
        stages = tenant_db.query(PipelineStage).filter(PipelineStage.pipeline_id == pipeline.id).order_by(PipelineStage.order.asc()).all()
        
        result = []
        for stage in stages:
            deals = tenant_db.query(Deal).filter(Deal.stage_id == stage.id).all()
            # Include contact info for each deal
            deal_list = []
            for d in deals:
                contact = tenant_db.query(Contact).filter(Contact.id == d.contact_id).first()
                deal_list.append({
                    "id": d.id,
                    "title": d.title,
                    "value": d.value,
                    "status": d.status,
                    "contact": {
                        "name": contact.name,
                        "phone": contact.phone,
                        "lead_score": contact.lead_score
                    }
                })
            
            result.append({
                "id": stage.id,
                "name": stage.name,
                "order": stage.order,
                "deals": deal_list
            })
            
        return result

@router.patch("/deals/{deal_id}/move")
def move_deal(deal_id: int, target_stage_id: int, db: Session = Depends(get_db)):
    """
    Moves a deal to a new stage.
    """
    tenant = db.query(Tenant).first()
    with tenant_db_session(tenant.schema_name) as tenant_db:
        deal = tenant_db.query(Deal).filter(Deal.id == deal_id).first()
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found")
            
        deal.stage_id = target_stage_id
        tenant_db.commit()
        return {"status": "success"}
