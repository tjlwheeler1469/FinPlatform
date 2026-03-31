"""
Workflow Engine - Multi-step workflow automation for financial advisors
Automates client onboarding, annual reviews, compliance tasks, and more.
This is the execution backbone that transforms processes into automated workflows.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/workflow", tags=["Workflow Engine"])

# Import database
try:
    from db import db
    workflows_collection = db.workflows
    workflow_instances_collection = db.workflow_instances
    workflow_steps_collection = db.workflow_steps
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    logger.warning("Database not available for workflow engine - using in-memory storage")


class WorkflowStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"


class StepStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    FAILED = "failed"
    BLOCKED = "blocked"


class StepType(str, Enum):
    MANUAL = "manual"  # Requires human action
    AUTOMATED = "automated"  # System performs automatically
    APPROVAL = "approval"  # Requires approval before continuing
    CONDITIONAL = "conditional"  # Branches based on conditions
    PARALLEL = "parallel"  # Multiple steps can run simultaneously
    NOTIFICATION = "notification"  # Send notification only
    DOCUMENT = "document"  # Document generation step
    INTEGRATION = "integration"  # External system integration


class TriggerType(str, Enum):
    MANUAL = "manual"
    SCHEDULED = "scheduled"
    EVENT = "event"  # Triggered by system event
    CONDITION = "condition"  # Triggered when conditions met


# In-memory storage fallback
WORKFLOWS_MEMORY: Dict[str, Dict] = {}
WORKFLOW_INSTANCES_MEMORY: Dict[str, Dict] = {}


# ==================== WORKFLOW TEMPLATES ====================

WORKFLOW_TEMPLATES = {
    "client_onboarding": {
        "id": "template_onboarding",
        "name": "New Client Onboarding",
        "description": "Complete onboarding workflow for new clients including KYC, documentation, and account setup",
        "category": "onboarding",
        "estimated_duration_days": 14,
        "steps": [
            {
                "step_id": "step_1",
                "name": "Initial Data Collection",
                "description": "Collect basic client information and requirements",
                "type": StepType.MANUAL,
                "order": 1,
                "estimated_duration": "30 minutes",
                "required_fields": ["full_name", "email", "phone", "address"],
                "actions": ["Create client profile", "Send welcome email"]
            },
            {
                "step_id": "step_2",
                "name": "KYC/AML Verification",
                "description": "Complete Know Your Customer and Anti-Money Laundering checks",
                "type": StepType.AUTOMATED,
                "order": 2,
                "estimated_duration": "24 hours",
                "actions": ["ID verification", "AML screening", "PEP check"],
                "dependencies": ["step_1"]
            },
            {
                "step_id": "step_3",
                "name": "Risk Profile Assessment",
                "description": "Complete risk tolerance questionnaire",
                "type": StepType.MANUAL,
                "order": 3,
                "estimated_duration": "20 minutes",
                "actions": ["Send risk questionnaire", "Score responses", "Generate profile"],
                "dependencies": ["step_1"]
            },
            {
                "step_id": "step_4",
                "name": "Document Collection",
                "description": "Collect required identification and financial documents",
                "type": StepType.MANUAL,
                "order": 4,
                "estimated_duration": "2-5 days",
                "required_documents": ["ID", "Proof of address", "Tax file number", "Bank statements"],
                "dependencies": ["step_1"]
            },
            {
                "step_id": "step_5",
                "name": "Compliance Review",
                "description": "Internal compliance team review and approval",
                "type": StepType.APPROVAL,
                "order": 5,
                "estimated_duration": "24-48 hours",
                "approvers": ["compliance_officer"],
                "dependencies": ["step_2", "step_3", "step_4"]
            },
            {
                "step_id": "step_6",
                "name": "Generate FSG & Engagement Letter",
                "description": "Generate and send Financial Services Guide and engagement documents",
                "type": StepType.DOCUMENT,
                "order": 6,
                "estimated_duration": "1 hour",
                "documents": ["FSG", "Engagement Letter", "Privacy Policy"],
                "dependencies": ["step_5"]
            },
            {
                "step_id": "step_7",
                "name": "Client Signature",
                "description": "Obtain client signatures on all required documents",
                "type": StepType.MANUAL,
                "order": 7,
                "estimated_duration": "1-3 days",
                "actions": ["Send for signature", "Track completion", "Archive signed docs"],
                "dependencies": ["step_6"]
            },
            {
                "step_id": "step_8",
                "name": "Account Setup",
                "description": "Set up investment accounts and platform access",
                "type": StepType.AUTOMATED,
                "order": 8,
                "estimated_duration": "2-4 hours",
                "actions": ["Create platform accounts", "Link bank accounts", "Set up reporting"],
                "dependencies": ["step_7"]
            },
            {
                "step_id": "step_9",
                "name": "Initial Meeting Scheduled",
                "description": "Schedule and conduct initial planning meeting",
                "type": StepType.MANUAL,
                "order": 9,
                "estimated_duration": "90 minutes",
                "actions": ["Schedule meeting", "Prepare agenda", "Conduct meeting", "Document outcomes"],
                "dependencies": ["step_8"]
            },
            {
                "step_id": "step_10",
                "name": "Onboarding Complete",
                "description": "Finalize onboarding and transition to ongoing service",
                "type": StepType.NOTIFICATION,
                "order": 10,
                "estimated_duration": "15 minutes",
                "actions": ["Send completion email", "Set next review date", "Update CRM"],
                "dependencies": ["step_9"]
            }
        ]
    },
    "annual_review": {
        "id": "template_annual_review",
        "name": "Annual Client Review",
        "description": "Comprehensive annual review workflow including compliance and planning",
        "category": "review",
        "estimated_duration_days": 7,
        "steps": [
            {
                "step_id": "step_1",
                "name": "Pre-Meeting Preparation",
                "description": "Generate reports and prepare meeting materials",
                "type": StepType.AUTOMATED,
                "order": 1,
                "estimated_duration": "1 hour",
                "actions": ["Generate portfolio report", "Calculate performance", "Identify discussion points"]
            },
            {
                "step_id": "step_2",
                "name": "Schedule Review Meeting",
                "description": "Contact client and schedule annual review",
                "type": StepType.MANUAL,
                "order": 2,
                "estimated_duration": "15 minutes",
                "actions": ["Send meeting invite", "Confirm attendance"],
                "dependencies": ["step_1"]
            },
            {
                "step_id": "step_3",
                "name": "Life Changes Assessment",
                "description": "Review any changes in client circumstances",
                "type": StepType.MANUAL,
                "order": 3,
                "estimated_duration": "20 minutes",
                "questions": ["Employment changes", "Family changes", "Health changes", "Financial changes"],
                "dependencies": ["step_2"]
            },
            {
                "step_id": "step_4",
                "name": "Conduct Review Meeting",
                "description": "Complete annual review meeting with client",
                "type": StepType.MANUAL,
                "order": 4,
                "estimated_duration": "60 minutes",
                "agenda": ["Performance review", "Goal progress", "Risk reconfirmation", "Strategy discussion"],
                "dependencies": ["step_3"]
            },
            {
                "step_id": "step_5",
                "name": "Process Meeting Notes",
                "description": "Document meeting outcomes and action items",
                "type": StepType.AUTOMATED,
                "order": 5,
                "estimated_duration": "15 minutes",
                "actions": ["Generate summary", "Create tasks", "Update CRM"],
                "dependencies": ["step_4"]
            },
            {
                "step_id": "step_6",
                "name": "Update SOA if Required",
                "description": "Generate updated Statement of Advice if needed",
                "type": StepType.CONDITIONAL,
                "order": 6,
                "estimated_duration": "2-4 hours",
                "condition": "strategy_changes_required",
                "dependencies": ["step_5"]
            },
            {
                "step_id": "step_7",
                "name": "Compliance Documentation",
                "description": "Complete all compliance requirements",
                "type": StepType.AUTOMATED,
                "order": 7,
                "estimated_duration": "30 minutes",
                "actions": ["Log review", "Update compliance records", "Set next review date"],
                "dependencies": ["step_5", "step_6"]
            },
            {
                "step_id": "step_8",
                "name": "Review Complete Notification",
                "description": "Send confirmation to client",
                "type": StepType.NOTIFICATION,
                "order": 8,
                "estimated_duration": "5 minutes",
                "actions": ["Send summary email", "Schedule follow-ups"],
                "dependencies": ["step_7"]
            }
        ]
    },
    "tax_planning": {
        "id": "template_tax_planning",
        "name": "End of Financial Year Tax Planning",
        "description": "Pre-EOFY tax optimization workflow",
        "category": "tax",
        "estimated_duration_days": 30,
        "steps": [
            {
                "step_id": "step_1",
                "name": "Tax Position Analysis",
                "description": "Analyze current tax position and opportunities",
                "type": StepType.AUTOMATED,
                "order": 1,
                "estimated_duration": "2 hours",
                "actions": ["Calculate CGT position", "Identify losses to harvest", "Review super contributions"]
            },
            {
                "step_id": "step_2",
                "name": "Client Tax Review Meeting",
                "description": "Discuss tax planning opportunities with client",
                "type": StepType.MANUAL,
                "order": 2,
                "estimated_duration": "45 minutes",
                "dependencies": ["step_1"]
            },
            {
                "step_id": "step_3",
                "name": "Execute Tax Loss Harvesting",
                "description": "Sell positions to crystallize losses",
                "type": StepType.APPROVAL,
                "order": 3,
                "estimated_duration": "1 day",
                "dependencies": ["step_2"]
            },
            {
                "step_id": "step_4",
                "name": "Super Contribution Top-up",
                "description": "Maximize concessional contributions",
                "type": StepType.MANUAL,
                "order": 4,
                "estimated_duration": "2-5 days",
                "dependencies": ["step_2"]
            },
            {
                "step_id": "step_5",
                "name": "Documentation & Compliance",
                "description": "Document all tax-related advice",
                "type": StepType.AUTOMATED,
                "order": 5,
                "estimated_duration": "30 minutes",
                "dependencies": ["step_3", "step_4"]
            }
        ]
    },
    "portfolio_rebalance": {
        "id": "template_rebalance",
        "name": "Portfolio Rebalancing",
        "description": "Systematic portfolio rebalancing workflow",
        "category": "investment",
        "estimated_duration_days": 3,
        "steps": [
            {
                "step_id": "step_1",
                "name": "Drift Analysis",
                "description": "Calculate portfolio drift from target",
                "type": StepType.AUTOMATED,
                "order": 1,
                "estimated_duration": "15 minutes"
            },
            {
                "step_id": "step_2",
                "name": "Trade Generation",
                "description": "Generate rebalancing trades",
                "type": StepType.AUTOMATED,
                "order": 2,
                "estimated_duration": "10 minutes",
                "dependencies": ["step_1"]
            },
            {
                "step_id": "step_3",
                "name": "CGT Impact Assessment",
                "description": "Assess capital gains tax implications",
                "type": StepType.AUTOMATED,
                "order": 3,
                "estimated_duration": "5 minutes",
                "dependencies": ["step_2"]
            },
            {
                "step_id": "step_4",
                "name": "Advisor Approval",
                "description": "Review and approve trades",
                "type": StepType.APPROVAL,
                "order": 4,
                "estimated_duration": "30 minutes",
                "dependencies": ["step_3"]
            },
            {
                "step_id": "step_5",
                "name": "Execute Trades",
                "description": "Submit orders to market",
                "type": StepType.INTEGRATION,
                "order": 5,
                "estimated_duration": "1-2 hours",
                "integration": "trading_platform",
                "dependencies": ["step_4"]
            },
            {
                "step_id": "step_6",
                "name": "Client Notification",
                "description": "Notify client of rebalancing",
                "type": StepType.NOTIFICATION,
                "order": 6,
                "estimated_duration": "5 minutes",
                "dependencies": ["step_5"]
            }
        ]
    }
}


def serialize_doc(doc) -> dict:
    """Convert MongoDB document to JSON-serializable format."""
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ==================== PYDANTIC MODELS ====================

class WorkflowCreate(BaseModel):
    template_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    client_id: str
    client_name: str
    trigger_type: TriggerType = TriggerType.MANUAL
    scheduled_date: Optional[str] = None
    custom_steps: Optional[List[Dict]] = None
    metadata: Optional[Dict] = None


class StepUpdate(BaseModel):
    status: StepStatus
    notes: Optional[str] = None
    completed_by: Optional[str] = None
    attachments: Optional[List[str]] = None


class WorkflowFilter(BaseModel):
    client_id: Optional[str] = None
    status: Optional[WorkflowStatus] = None
    category: Optional[str] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None


# ==================== API ENDPOINTS ====================

@router.get("/templates")
async def get_workflow_templates() -> dict:
    """Get all available workflow templates."""
    templates = []
    for template_id, template in WORKFLOW_TEMPLATES.items():
        templates.append({
            "id": template["id"],
            "name": template["name"],
            "description": template["description"],
            "category": template["category"],
            "estimated_duration_days": template["estimated_duration_days"],
            "total_steps": len(template["steps"]),
            "step_types": list(set(s["type"] for s in template["steps"]))
        })
    
    return {
        "templates": templates,
        "total": len(templates),
        "categories": list(set(t["category"] for t in WORKFLOW_TEMPLATES.values()))
    }


@router.get("/templates/{template_id}")
async def get_workflow_template(template_id: str) -> dict:
    """Get detailed workflow template."""
    # Handle both full ID and short name
    template = None
    for key, tmpl in WORKFLOW_TEMPLATES.items():
        if tmpl["id"] == template_id or key == template_id:
            template = tmpl
            break
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template


@router.post("/create")
async def create_workflow(workflow: WorkflowCreate) -> dict:
    """Create a new workflow instance from template or custom definition."""
    workflow_id = f"wf_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    
    # Get template if specified
    steps = []
    if workflow.template_id:
        template = None
        for key, tmpl in WORKFLOW_TEMPLATES.items():
            if tmpl["id"] == workflow.template_id or key == workflow.template_id:
                template = tmpl
                break
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Copy steps from template
        for step in template["steps"]:
            steps.append({
                **step,
                "instance_step_id": f"inst_{step['step_id']}_{uuid.uuid4().hex[:4]}",
                "status": StepStatus.PENDING,
                "started_at": None,
                "completed_at": None,
                "assigned_to": None,
                "notes": None
            })
    elif workflow.custom_steps:
        steps = workflow.custom_steps
    else:
        raise HTTPException(status_code=400, detail="Either template_id or custom_steps required")
    
    # Calculate estimated completion
    total_days = sum(1 for s in steps if "day" in s.get("estimated_duration", "").lower())
    estimated_completion = (now + timedelta(days=max(7, total_days))).isoformat()
    
    workflow_data = {
        "workflow_id": workflow_id,
        "name": workflow.name,
        "description": workflow.description or (template["description"] if workflow.template_id else ""),
        "template_id": workflow.template_id,
        "client_id": workflow.client_id,
        "client_name": workflow.client_name,
        "status": WorkflowStatus.ACTIVE,
        "trigger_type": workflow.trigger_type,
        "scheduled_date": workflow.scheduled_date,
        "steps": steps,
        "current_step": 1,
        "total_steps": len(steps),
        "progress_percentage": 0,
        "metadata": workflow.metadata or {},
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "estimated_completion": estimated_completion,
        "completed_at": None
    }
    
    # Store workflow
    if DB_AVAILABLE:
        await workflow_instances_collection.insert_one(workflow_data.copy())
    else:
        WORKFLOW_INSTANCES_MEMORY[workflow_id] = workflow_data
    
    return {
        "success": True,
        "workflow_id": workflow_id,
        "workflow": workflow_data,
        "message": f"Workflow '{workflow.name}' created with {len(steps)} steps",
        "storage": "mongodb" if DB_AVAILABLE else "in-memory"
    }


@router.get("/instances")
async def get_workflow_instances(
    client_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50
) -> dict:
    """Get all workflow instances with optional filtering."""
    if DB_AVAILABLE:
        query = {}
        if client_id:
            query["client_id"] = client_id
        if status:
            query["status"] = status
        
        cursor = workflow_instances_collection.find(query).limit(limit)
        instances = [serialize_doc(w) async for w in cursor]
    else:
        instances = list(WORKFLOW_INSTANCES_MEMORY.values())
        if client_id:
            instances = [w for w in instances if w["client_id"] == client_id]
        if status:
            instances = [w for w in instances if w["status"] == status]
        instances = instances[:limit]
    
    # Calculate stats
    active = len([w for w in instances if w.get("status") == WorkflowStatus.ACTIVE])
    completed = len([w for w in instances if w.get("status") == WorkflowStatus.COMPLETED])
    
    return {
        "workflows": instances,
        "total": len(instances),
        "active": active,
        "completed": completed,
        "storage": "mongodb" if DB_AVAILABLE else "in-memory"
    }


@router.get("/instances/{workflow_id}")
async def get_workflow_instance(workflow_id: str) -> dict:
    """Get detailed workflow instance."""
    if DB_AVAILABLE:
        workflow = await workflow_instances_collection.find_one({"workflow_id": workflow_id})
        workflow = serialize_doc(workflow)
    else:
        workflow = WORKFLOW_INSTANCES_MEMORY.get(workflow_id)
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Calculate additional metrics
    completed_steps = len([s for s in workflow.get("steps", []) if s.get("status") == StepStatus.COMPLETED])
    blocked_steps = len([s for s in workflow.get("steps", []) if s.get("status") == StepStatus.BLOCKED])
    
    workflow["metrics"] = {
        "completed_steps": completed_steps,
        "blocked_steps": blocked_steps,
        "remaining_steps": workflow["total_steps"] - completed_steps
    }
    
    return workflow


@router.put("/instances/{workflow_id}/steps/{step_id}")
async def update_workflow_step(workflow_id: str, step_id: str, update: StepUpdate) -> dict:
    """Update a specific step in a workflow."""
    now = datetime.now(timezone.utc)
    
    if DB_AVAILABLE:
        workflow = await workflow_instances_collection.find_one({"workflow_id": workflow_id})
        workflow = serialize_doc(workflow)
    else:
        workflow = WORKFLOW_INSTANCES_MEMORY.get(workflow_id)
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Find and update the step
    step_found = False
    for step in workflow["steps"]:
        if step["step_id"] == step_id or step.get("instance_step_id") == step_id:
            step["status"] = update.status
            step["notes"] = update.notes
            if update.completed_by:
                step["completed_by"] = update.completed_by
            if update.attachments:
                step["attachments"] = update.attachments
            
            if update.status == StepStatus.IN_PROGRESS and not step.get("started_at"):
                step["started_at"] = now.isoformat()
            elif update.status == StepStatus.COMPLETED:
                step["completed_at"] = now.isoformat()
            
            step_found = True
            break
    
    if not step_found:
        raise HTTPException(status_code=404, detail="Step not found")
    
    # Update workflow progress
    completed_steps = len([s for s in workflow["steps"] if s.get("status") == StepStatus.COMPLETED])
    workflow["progress_percentage"] = round((completed_steps / workflow["total_steps"]) * 100, 1)
    workflow["current_step"] = completed_steps + 1
    workflow["updated_at"] = now.isoformat()
    
    # Check if workflow is complete
    if completed_steps == workflow["total_steps"]:
        workflow["status"] = WorkflowStatus.COMPLETED
        workflow["completed_at"] = now.isoformat()
    
    # Check for blocked steps (dependencies not met)
    for step in workflow["steps"]:
        if step.get("status") == StepStatus.PENDING and step.get("dependencies"):
            deps_met = all(
                any(s.get("status") == StepStatus.COMPLETED and (s["step_id"] == dep or s.get("instance_step_id", "").startswith(f"inst_{dep}"))
                    for s in workflow["steps"])
                for dep in step["dependencies"]
            )
            if not deps_met:
                step["status"] = StepStatus.BLOCKED
    
    # Save updated workflow
    if DB_AVAILABLE:
        await workflow_instances_collection.update_one(
            {"workflow_id": workflow_id},
            {"$set": {
                "steps": workflow["steps"],
                "progress_percentage": workflow["progress_percentage"],
                "current_step": workflow["current_step"],
                "status": workflow["status"],
                "updated_at": workflow["updated_at"],
                "completed_at": workflow.get("completed_at")
            }}
        )
    else:
        WORKFLOW_INSTANCES_MEMORY[workflow_id] = workflow
    
    return {
        "success": True,
        "workflow_id": workflow_id,
        "step_id": step_id,
        "step_status": update.status,
        "workflow_progress": workflow["progress_percentage"],
        "workflow_status": workflow["status"],
        "message": f"Step updated to {update.status}"
    }


@router.post("/instances/{workflow_id}/pause")
async def pause_workflow(workflow_id: str, reason: Optional[str] = None) -> dict:
    """Pause a workflow."""
    if DB_AVAILABLE:
        result = await workflow_instances_collection.update_one(
            {"workflow_id": workflow_id},
            {"$set": {
                "status": WorkflowStatus.PAUSED,
                "pause_reason": reason,
                "paused_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Workflow not found")
    else:
        if workflow_id not in WORKFLOW_INSTANCES_MEMORY:
            raise HTTPException(status_code=404, detail="Workflow not found")
        WORKFLOW_INSTANCES_MEMORY[workflow_id]["status"] = WorkflowStatus.PAUSED
        WORKFLOW_INSTANCES_MEMORY[workflow_id]["pause_reason"] = reason
        WORKFLOW_INSTANCES_MEMORY[workflow_id]["paused_at"] = datetime.now(timezone.utc).isoformat()
    
    return {"success": True, "workflow_id": workflow_id, "status": WorkflowStatus.PAUSED}


@router.post("/instances/{workflow_id}/resume")
async def resume_workflow(workflow_id: str) -> dict:
    """Resume a paused workflow."""
    if DB_AVAILABLE:
        result = await workflow_instances_collection.update_one(
            {"workflow_id": workflow_id},
            {"$set": {
                "status": WorkflowStatus.ACTIVE,
                "resumed_at": datetime.now(timezone.utc).isoformat()
            },
            "$unset": {"pause_reason": "", "paused_at": ""}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Workflow not found")
    else:
        if workflow_id not in WORKFLOW_INSTANCES_MEMORY:
            raise HTTPException(status_code=404, detail="Workflow not found")
        WORKFLOW_INSTANCES_MEMORY[workflow_id]["status"] = WorkflowStatus.ACTIVE
        WORKFLOW_INSTANCES_MEMORY[workflow_id]["resumed_at"] = datetime.now(timezone.utc).isoformat()
    
    return {"success": True, "workflow_id": workflow_id, "status": WorkflowStatus.ACTIVE}


@router.post("/instances/{workflow_id}/cancel")
async def cancel_workflow(workflow_id: str, reason: Optional[str] = None) -> dict:
    """Cancel a workflow."""
    if DB_AVAILABLE:
        result = await workflow_instances_collection.update_one(
            {"workflow_id": workflow_id},
            {"$set": {
                "status": WorkflowStatus.CANCELLED,
                "cancel_reason": reason,
                "cancelled_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Workflow not found")
    else:
        if workflow_id not in WORKFLOW_INSTANCES_MEMORY:
            raise HTTPException(status_code=404, detail="Workflow not found")
        WORKFLOW_INSTANCES_MEMORY[workflow_id]["status"] = WorkflowStatus.CANCELLED
        WORKFLOW_INSTANCES_MEMORY[workflow_id]["cancel_reason"] = reason
        WORKFLOW_INSTANCES_MEMORY[workflow_id]["cancelled_at"] = datetime.now(timezone.utc).isoformat()
    
    return {"success": True, "workflow_id": workflow_id, "status": WorkflowStatus.CANCELLED}


@router.get("/dashboard")
async def get_workflow_dashboard(advisor_id: str = "default") -> dict:
    """Get workflow dashboard with summary metrics."""
    if DB_AVAILABLE:
        active_count = await workflow_instances_collection.count_documents({"status": WorkflowStatus.ACTIVE})
        completed_count = await workflow_instances_collection.count_documents({"status": WorkflowStatus.COMPLETED})
        paused_count = await workflow_instances_collection.count_documents({"status": WorkflowStatus.PAUSED})
        
        cursor = workflow_instances_collection.find({"status": WorkflowStatus.ACTIVE}).limit(10)
        active_workflows = [serialize_doc(w) async for w in cursor]
    else:
        workflows = list(WORKFLOW_INSTANCES_MEMORY.values())
        active_count = len([w for w in workflows if w.get("status") == WorkflowStatus.ACTIVE])
        completed_count = len([w for w in workflows if w.get("status") == WorkflowStatus.COMPLETED])
        paused_count = len([w for w in workflows if w.get("status") == WorkflowStatus.PAUSED])
        active_workflows = [w for w in workflows if w.get("status") == WorkflowStatus.ACTIVE][:10]
    
    # Calculate steps needing action
    steps_needing_action = []
    for workflow in active_workflows:
        for step in workflow.get("steps", []):
            if step.get("status") in [StepStatus.PENDING, StepStatus.IN_PROGRESS]:
                if step.get("type") in [StepType.MANUAL, StepType.APPROVAL]:
                    steps_needing_action.append({
                        "workflow_id": workflow["workflow_id"],
                        "workflow_name": workflow["name"],
                        "client_name": workflow["client_name"],
                        "step_id": step["step_id"],
                        "step_name": step["name"],
                        "step_type": step["type"],
                        "status": step["status"],
                        "estimated_duration": step.get("estimated_duration")
                    })
    
    return {
        "summary": {
            "active_workflows": active_count,
            "completed_workflows": completed_count,
            "paused_workflows": paused_count,
            "steps_needing_action": len(steps_needing_action)
        },
        "action_items": steps_needing_action[:20],
        "active_workflows": [{
            "workflow_id": w["workflow_id"],
            "name": w["name"],
            "client_name": w["client_name"],
            "progress": w["progress_percentage"],
            "current_step": w["current_step"],
            "total_steps": w["total_steps"],
            "status": w["status"]
        } for w in active_workflows],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/by-client/{client_id}/active")
async def get_active_workflows_for_client(client_id: str) -> dict:
    """Get all active workflows for a specific client."""
    if DB_AVAILABLE:
        cursor = workflow_instances_collection.find({
            "client_id": client_id,
            "status": {"$in": [WorkflowStatus.ACTIVE, WorkflowStatus.PAUSED]}
        })
        workflows = [serialize_doc(w) async for w in cursor]
    else:
        workflows = [
            w for w in WORKFLOW_INSTANCES_MEMORY.values()
            if w["client_id"] == client_id and w.get("status") in [WorkflowStatus.ACTIVE, WorkflowStatus.PAUSED]
        ]
    
    return {
        "client_id": client_id,
        "workflows": workflows,
        "total": len(workflows)
    }


@router.post("/quick-start/{template_key}")
async def quick_start_workflow(
    template_key: str,
    client_id: str,
    client_name: str
) -> dict:
    """Quick start a workflow from a template key."""
    if template_key not in WORKFLOW_TEMPLATES:
        raise HTTPException(status_code=404, detail=f"Template '{template_key}' not found")
    
    template = WORKFLOW_TEMPLATES[template_key]
    
    workflow_request = WorkflowCreate(
        template_id=template["id"],
        name=f"{template['name']} - {client_name}",
        client_id=client_id,
        client_name=client_name,
        trigger_type=TriggerType.MANUAL
    )
    
    return await create_workflow(workflow_request)


@router.get("/stats")
async def get_workflow_stats() -> dict:
    """Get comprehensive workflow statistics."""
    if DB_AVAILABLE:
        total = await workflow_instances_collection.count_documents({})
        active = await workflow_instances_collection.count_documents({"status": WorkflowStatus.ACTIVE})
        completed = await workflow_instances_collection.count_documents({"status": WorkflowStatus.COMPLETED})
        cancelled = await workflow_instances_collection.count_documents({"status": WorkflowStatus.CANCELLED})
        
        # Get category breakdown
        cursor = workflow_instances_collection.find({})
        workflows = [serialize_doc(w) async for w in cursor]
    else:
        workflows = list(WORKFLOW_INSTANCES_MEMORY.values())
        total = len(workflows)
        active = len([w for w in workflows if w.get("status") == WorkflowStatus.ACTIVE])
        completed = len([w for w in workflows if w.get("status") == WorkflowStatus.COMPLETED])
        cancelled = len([w for w in workflows if w.get("status") == WorkflowStatus.CANCELLED])
    
    # Calculate average completion time for completed workflows
    completion_times = []
    for w in workflows:
        if w.get("status") == WorkflowStatus.COMPLETED and w.get("created_at") and w.get("completed_at"):
            try:
                created = datetime.fromisoformat(w["created_at"].replace("Z", "+00:00"))
                completed_dt = datetime.fromisoformat(w["completed_at"].replace("Z", "+00:00"))
                completion_times.append((completed_dt - created).days)
            except Exception:
                pass
    
    avg_completion_days = round(sum(completion_times) / len(completion_times), 1) if completion_times else 0
    
    return {
        "totals": {
            "total_workflows": total,
            "active": active,
            "completed": completed,
            "cancelled": cancelled,
            "completion_rate": round((completed / total * 100), 1) if total > 0 else 0
        },
        "performance": {
            "avg_completion_days": avg_completion_days,
            "workflows_completed_this_month": len([
                w for w in workflows 
                if w.get("completed_at") and 
                datetime.fromisoformat(w["completed_at"].replace("Z", "+00:00")).month == datetime.now().month
            ])
        },
        "templates_available": len(WORKFLOW_TEMPLATES),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
