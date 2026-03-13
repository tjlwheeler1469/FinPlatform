"""
Client CRM and Adviser Workflow Service
Provides client management, meeting notes, tasks, and advice workflow.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid


class ClientStatus(str, Enum):
    PROSPECT = "prospect"
    ACTIVE = "active"
    REVIEW = "review"
    INACTIVE = "inactive"


class AdviceStage(str, Enum):
    DISCOVERY = "discovery"
    ANALYSIS = "analysis"
    STRATEGY = "strategy"
    PRESENTATION = "presentation"
    IMPLEMENTATION = "implementation"
    REVIEW = "review"
    COMPLETE = "complete"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# Default client data structure
def create_client(
    name: str,
    email: str,
    phone: Optional[str] = None,
    adviser_id: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new client record"""
    client_id = f"client_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    return {
        'client_id': client_id,
        'name': name,
        'email': email,
        'phone': phone,
        'status': ClientStatus.PROSPECT.value,
        'adviser_id': adviser_id,
        'created_at': now,
        'updated_at': now,
        'last_contact': now,
        'next_review_date': (datetime.now(timezone.utc) + timedelta(days=365)).isoformat(),
        'financial_summary': {
            'net_worth': 0,
            'total_assets': 0,
            'total_debt': 0,
            'annual_income': 0,
            'risk_profile': 'moderate'
        },
        'tags': [],
        'notes_count': 0,
        'tasks_count': 0,
        'documents_count': 0
    }


def create_meeting_note(
    client_id: str,
    adviser_id: str,
    title: str,
    content: str,
    meeting_type: str = "general",
    action_items: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Create a meeting note"""
    note_id = f"note_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    return {
        'note_id': note_id,
        'client_id': client_id,
        'adviser_id': adviser_id,
        'title': title,
        'content': content,
        'meeting_type': meeting_type,  # discovery, review, strategy, follow-up
        'action_items': action_items or [],
        'created_at': now,
        'updated_at': now,
        'is_pinned': False
    }


def create_task(
    client_id: str,
    adviser_id: str,
    title: str,
    description: Optional[str] = None,
    due_date: Optional[str] = None,
    priority: TaskPriority = TaskPriority.MEDIUM,
    category: str = "general"
) -> Dict[str, Any]:
    """Create a task"""
    task_id = f"task_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    return {
        'task_id': task_id,
        'client_id': client_id,
        'adviser_id': adviser_id,
        'title': title,
        'description': description,
        'status': TaskStatus.PENDING.value,
        'priority': priority.value,
        'category': category,  # compliance, follow-up, document, review
        'due_date': due_date,
        'created_at': now,
        'updated_at': now,
        'completed_at': None
    }


def create_document(
    client_id: str,
    adviser_id: str,
    name: str,
    document_type: str,
    file_url: Optional[str] = None,
    file_size: int = 0
) -> Dict[str, Any]:
    """Create a document record"""
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    return {
        'document_id': doc_id,
        'client_id': client_id,
        'adviser_id': adviser_id,
        'name': name,
        'document_type': document_type,  # soa, fsg, risk_profile, id, tax_return, etc.
        'file_url': file_url,
        'file_size': file_size,
        'uploaded_at': now,
        'is_signed': False,
        'signed_at': None,
        'expiry_date': None
    }


# Advice Workflow
ADVICE_WORKFLOW_STAGES = [
    {
        'stage': AdviceStage.DISCOVERY.value,
        'title': 'Discovery',
        'description': 'Gather client information and understand goals',
        'tasks': [
            'Complete fact find questionnaire',
            'Collect identification documents',
            'Review existing financial arrangements',
            'Understand client goals and objectives'
        ],
        'required_documents': ['ID', 'Tax Returns', 'Super Statements'],
        'estimated_days': 7
    },
    {
        'stage': AdviceStage.ANALYSIS.value,
        'title': 'Analysis',
        'description': 'Analyze client situation and identify opportunities',
        'tasks': [
            'Review current portfolio allocation',
            'Analyze tax position',
            'Assess insurance needs',
            'Run retirement projections',
            'Identify optimization opportunities'
        ],
        'required_documents': [],
        'estimated_days': 14
    },
    {
        'stage': AdviceStage.STRATEGY.value,
        'title': 'Strategy Development',
        'description': 'Develop personalized financial strategy',
        'tasks': [
            'Create investment strategy',
            'Design super contribution plan',
            'Develop tax optimization strategy',
            'Prepare scenario comparisons',
            'Draft recommendations'
        ],
        'required_documents': [],
        'estimated_days': 7
    },
    {
        'stage': AdviceStage.PRESENTATION.value,
        'title': 'Present & Approve',
        'description': 'Present strategy and obtain client approval',
        'tasks': [
            'Prepare Statement of Advice (SOA)',
            'Schedule presentation meeting',
            'Present recommendations to client',
            'Address client questions',
            'Obtain written consent'
        ],
        'required_documents': ['SOA', 'Authority to Proceed'],
        'estimated_days': 14
    },
    {
        'stage': AdviceStage.IMPLEMENTATION.value,
        'title': 'Implementation',
        'description': 'Execute the approved strategy',
        'tasks': [
            'Submit super contribution elections',
            'Execute investment trades',
            'Set up insurance policies',
            'Process account applications',
            'Confirm all implementations'
        ],
        'required_documents': ['Application Forms', 'Transfer Documents'],
        'estimated_days': 21
    },
    {
        'stage': AdviceStage.REVIEW.value,
        'title': 'Ongoing Review',
        'description': 'Monitor and review client progress',
        'tasks': [
            'Schedule annual review',
            'Monitor portfolio performance',
            'Review insurance adequacy',
            'Update client circumstances',
            'Prepare review report'
        ],
        'required_documents': ['Review Report'],
        'estimated_days': 365
    }
]


def create_advice_workflow(
    client_id: str,
    adviser_id: str,
    workflow_type: str = "comprehensive"
) -> Dict[str, Any]:
    """Create a new advice workflow for a client"""
    workflow_id = f"workflow_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    stages = []
    cumulative_days = 0
    
    for stage_template in ADVICE_WORKFLOW_STAGES:
        cumulative_days += stage_template['estimated_days']
        stage_data = {
            'stage': stage_template['stage'],
            'title': stage_template['title'],
            'description': stage_template['description'],
            'status': 'pending' if stage_template['stage'] != AdviceStage.DISCOVERY.value else 'in_progress',
            'tasks': [{'task': t, 'completed': False} for t in stage_template['tasks']],
            'required_documents': stage_template['required_documents'],
            'target_date': (now + timedelta(days=cumulative_days)).isoformat(),
            'started_at': now.isoformat() if stage_template['stage'] == AdviceStage.DISCOVERY.value else None,
            'completed_at': None,
            'notes': ''
        }
        stages.append(stage_data)
    
    return {
        'workflow_id': workflow_id,
        'client_id': client_id,
        'adviser_id': adviser_id,
        'workflow_type': workflow_type,
        'current_stage': AdviceStage.DISCOVERY.value,
        'stages': stages,
        'created_at': now.isoformat(),
        'updated_at': now.isoformat(),
        'estimated_completion': (now + timedelta(days=cumulative_days)).isoformat(),
        'is_active': True,
        'progress_percentage': 0
    }


def update_workflow_progress(workflow: Dict) -> Dict:
    """Update workflow progress percentage"""
    total_tasks = 0
    completed_tasks = 0
    
    for stage in workflow['stages']:
        for task in stage['tasks']:
            total_tasks += 1
            if task['completed']:
                completed_tasks += 1
    
    workflow['progress_percentage'] = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
    workflow['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    return workflow


def advance_workflow_stage(workflow: Dict, new_stage: str) -> Dict:
    """Advance workflow to the next stage"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Mark current stage as complete
    for stage in workflow['stages']:
        if stage['stage'] == workflow['current_stage']:
            stage['status'] = 'completed'
            stage['completed_at'] = now
        elif stage['stage'] == new_stage:
            stage['status'] = 'in_progress'
            stage['started_at'] = now
    
    workflow['current_stage'] = new_stage
    workflow['updated_at'] = now
    
    return update_workflow_progress(workflow)


# Client Portal Data
def get_client_portal_data(
    client: Dict,
    goals: List[Dict],
    tasks: List[Dict],
    documents: List[Dict],
    messages: Optional[List[Dict]] = None
) -> Dict[str, Any]:
    """Get data for client portal view"""
    return {
        'client': {
            'name': client['name'],
            'email': client['email'],
            'status': client['status'],
            'next_review_date': client['next_review_date']
        },
        'financial_summary': client['financial_summary'],
        'goals': [
            {
                'name': g['name'],
                'progress': g['progress'],
                'target': g['target'],
                'current': g['current']
            }
            for g in goals
        ],
        'pending_tasks': [
            {
                'title': t['title'],
                'due_date': t['due_date'],
                'priority': t['priority']
            }
            for t in tasks if t['status'] == TaskStatus.PENDING.value
        ],
        'documents': [
            {
                'name': d['name'],
                'type': d['document_type'],
                'uploaded_at': d['uploaded_at'],
                'requires_signature': not d['is_signed'] and d['document_type'] in ['soa', 'authority']
            }
            for d in documents
        ],
        'unread_messages': len([m for m in (messages or []) if not m.get('is_read', True)])
    }


# Demo Data
def generate_demo_clients() -> List[Dict[str, Any]]:
    """Generate demo client data"""
    now = datetime.now(timezone.utc)
    
    return [
        {
            'client_id': 'client_wheeler001',
            'name': 'John & Sarah Wheeler',
            'email': 'wheeler@email.com',
            'phone': '0412 345 678',
            'status': ClientStatus.ACTIVE.value,
            'adviser_id': 'adviser_001',
            'created_at': (now - timedelta(days=365)).isoformat(),
            'updated_at': now.isoformat(),
            'last_contact': (now - timedelta(days=14)).isoformat(),
            'next_review_date': (now + timedelta(days=180)).isoformat(),
            'financial_summary': {
                'net_worth': 1978000,
                'total_assets': 2920000,
                'total_debt': 942000,
                'annual_income': 185000,
                'risk_profile': 'growth'
            },
            'tags': ['high-value', 'property-investor'],
            'notes_count': 12,
            'tasks_count': 3,
            'documents_count': 8,
            'advice_stage': AdviceStage.REVIEW.value
        },
        {
            'client_id': 'client_chen002',
            'name': 'Michael Chen',
            'email': 'mchen@email.com',
            'phone': '0423 456 789',
            'status': ClientStatus.ACTIVE.value,
            'adviser_id': 'adviser_001',
            'created_at': (now - timedelta(days=90)).isoformat(),
            'updated_at': now.isoformat(),
            'last_contact': (now - timedelta(days=7)).isoformat(),
            'next_review_date': (now + timedelta(days=270)).isoformat(),
            'financial_summary': {
                'net_worth': 850000,
                'total_assets': 1100000,
                'total_debt': 250000,
                'annual_income': 145000,
                'risk_profile': 'balanced'
            },
            'tags': ['young-professional'],
            'notes_count': 5,
            'tasks_count': 6,
            'documents_count': 4,
            'advice_stage': AdviceStage.IMPLEMENTATION.value
        },
        {
            'client_id': 'client_patel003',
            'name': 'Priya Patel',
            'email': 'ppatel@email.com',
            'phone': '0434 567 890',
            'status': ClientStatus.PROSPECT.value,
            'adviser_id': 'adviser_001',
            'created_at': (now - timedelta(days=14)).isoformat(),
            'updated_at': now.isoformat(),
            'last_contact': (now - timedelta(days=3)).isoformat(),
            'next_review_date': None,
            'financial_summary': {
                'net_worth': 320000,
                'total_assets': 420000,
                'total_debt': 100000,
                'annual_income': 95000,
                'risk_profile': 'moderate'
            },
            'tags': ['new-prospect', 'referral'],
            'notes_count': 2,
            'tasks_count': 4,
            'documents_count': 1,
            'advice_stage': AdviceStage.DISCOVERY.value
        },
        {
            'client_id': 'client_jones004',
            'name': 'Robert & Emma Jones',
            'email': 'jones@email.com',
            'phone': '0445 678 901',
            'status': ClientStatus.REVIEW.value,
            'adviser_id': 'adviser_001',
            'created_at': (now - timedelta(days=730)).isoformat(),
            'updated_at': (now - timedelta(days=30)).isoformat(),
            'last_contact': (now - timedelta(days=45)).isoformat(),
            'next_review_date': (now - timedelta(days=15)).isoformat(),
            'financial_summary': {
                'net_worth': 2450000,
                'total_assets': 3100000,
                'total_debt': 650000,
                'annual_income': 220000,
                'risk_profile': 'conservative'
            },
            'tags': ['high-value', 'pre-retirement'],
            'notes_count': 24,
            'tasks_count': 2,
            'documents_count': 15,
            'advice_stage': AdviceStage.REVIEW.value
        }
    ]
