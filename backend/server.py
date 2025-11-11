from fastapi import FastAPI, APIRouter, HTTPException, Cookie, Response, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import requests
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# LLM Chat for AI summaries
llm_chat = LlmChat(
    api_key=os.environ.get('EMERGENT_LLM_KEY'),
    session_id="curalink-summaries",
    system_message="You are a medical AI assistant that creates clear, concise summaries of clinical research and trials for patients and researchers."
).with_model("openai", "gpt-4o-mini")

# ============ Models ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    roles: List[str] = []  # Can be ['patient'], ['researcher'], or ['patient', 'researcher']
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PatientProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    conditions: List[str] = []
    location: Optional[str] = None
    interests: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResearcherProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    name: str
    specialties: List[str] = []
    research_interests: List[str] = []
    age: int
    years_experience: int
    sector: str
    available_hours: str  # e.g., "9 AM - 5 PM" or "Flexible"
    orcid: Optional[str] = None
    researchgate: Optional[str] = None
    available_for_meetings: bool = True
    bio: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClinicalTrial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    phase: str
    status: str
    location: str
    eligibility: str
    disease_areas: List[str] = []
    contact_email: Optional[str] = None
    created_by: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Publication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    authors: List[str] = []
    abstract: str
    journal: str
    year: int
    doi: Optional[str] = None
    disease_areas: List[str] = []
    url: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HealthExpert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    specialty: str
    location: str
    email: Optional[str] = None
    profile_url: Optional[str] = None
    is_platform_member: bool = False
    research_areas: List[str] = []
    bio: Optional[str] = None
    user_id: Optional[str] = None

class Forum(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str
    post_count: int = 0
    created_by: Optional[str] = None  # User ID of creator
    created_by_name: Optional[str] = None  # Name of creator
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ForumPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    forum_id: str
    user_id: str
    user_name: str
    user_role: str
    content: str
    parent_id: Optional[str] = None
    image_url: Optional[str] = None  # For patient image uploads
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ForumMembership(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    forum_id: str
    forum_name: str
    user_id: str
    user_name: str
    specialty: str  # The researcher's specialty that matches this forum
    is_moderator: bool = False
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Question(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    title: str
    content: str
    condition: Optional[str] = None
    is_anonymous: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Answer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question_id: str
    researcher_id: str
    researcher_name: str
    researcher_specialty: Optional[str] = None
    content: str
    likes: int = 0
    dislikes: int = 0
    parent_id: Optional[str] = None  # For researcher replies to other researchers
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Vote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    answer_id: str
    user_id: str
    vote_type: str  # 'like' or 'dislike'
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AppointmentRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    patient_name: str
    researcher_id: str
    condition: str
    location: str
    duration_suffering: str
    status: str = "pending"  # pending, accepted, rejected, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # 'appointment_request', 'review_received'
    title: str
    content: str
    link: Optional[str] = None
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRoom(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    appointment_id: str
    patient_id: str
    researcher_id: str
    status: str = "active"  # active, closed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: Optional[datetime] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chat_room_id: str
    sender_id: str
    sender_name: str
    sender_role: str
    message_type: str  # 'text' or 'image'
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    appointment_id: str
    patient_id: str
    researcher_id: str
    rating: int  # 1-5 stars
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Favorite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    item_type: str  # 'trial', 'publication', 'expert', 'collaborator'
    item_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MeetingRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    expert_id: str
    message: str
    status: str = "pending"  # pending, accepted, declined
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ Request/Response Models ============

class SessionDataRequest(BaseModel):
    session_id: str

class ProfileUpdateRequest(BaseModel):
    conditions: Optional[List[str]] = None
    location: Optional[str] = None
    interests: Optional[List[str]] = None
    name: Optional[str] = None
    specialties: Optional[List[str]] = None
    research_interests: Optional[List[str]] = None
    age: Optional[int] = None
    years_experience: Optional[int] = None
    sector: Optional[str] = None
    available_hours: Optional[str] = None
    orcid: Optional[str] = None
    researchgate: Optional[str] = None
    available_for_meetings: Optional[bool] = None
    bio: Optional[str] = None

class TrialCreateRequest(BaseModel):
    title: str
    description: str
    phase: str
    status: str
    location: str
    eligibility: str
    disease_areas: List[str] = []
    contact_email: Optional[str] = None

class ForumCreateRequest(BaseModel):
    name: str
    description: str
    category: str

class ForumPostCreateRequest(BaseModel):
    forum_id: str
    content: str
    parent_id: Optional[str] = None
    image_url: Optional[str] = None

class FavoriteCreateRequest(BaseModel):
    item_type: str
    item_id: str

class MeetingRequestCreate(BaseModel):
    expert_id: str
    message: str

class QuestionCreateRequest(BaseModel):
    title: str
    content: str
    condition: Optional[str] = None
    is_anonymous: bool = True

class AnswerCreateRequest(BaseModel):
    question_id: str
    content: str
    parent_id: Optional[str] = None

class VoteRequest(BaseModel):
    answer_id: str
    vote_type: str  # 'like' or 'dislike'

class AppointmentRequestCreate(BaseModel):
    researcher_id: str
    patient_name: str
    condition: str
    location: str
    duration_suffering: str

class NotificationRead(BaseModel):
    notification_id: str

class ChatMessageCreate(BaseModel):
    chat_room_id: str
    message_type: str  # 'text' or 'image'
    content: str

class ReviewCreate(BaseModel):
    appointment_id: str
    rating: int
    comment: str

# ============ Helper Functions ============

async def get_current_user(session_token: Optional[str] = None, authorization: Optional[str] = None) -> Optional[User]:
    """Get user from session token (cookie or header)"""
    token = session_token
    if not token and authorization:
        token = authorization.replace("Bearer ", "")
    
    if not token:
        return None
    
    session = await db.user_sessions.find_one({"session_token": token})
    if not session:
        return None
    
    # Check expiry
    expires_at = session.get('expires_at')
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": token})
        return None
    
    user_doc = await db.users.find_one({"id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

async def generate_ai_summary(text: str, context: str = "medical") -> str:
    """Generate AI summary using LLM"""
    try:
        message = UserMessage(text=f"Summarize this {context} content in 2-3 clear sentences for a general audience: {text[:2000]}")
        response = await llm_chat.send_message(message)
        return response
    except Exception as e:
        logging.error(f"AI summary failed: {e}")
        return "Summary not available"

# ============ Auth Endpoints ============

@api_router.post("/auth/session")
async def process_session(data: SessionDataRequest, response: Response):
    """Process session_id from Emergent Auth"""
    try:
        # Call Emergent Auth to get session data
        auth_backend_url = os.environ.get('EMERGENT_AUTH_BACKEND_URL', 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data')
        auth_response = requests.get(
            auth_backend_url,
            headers={"X-Session-ID": data.session_id},
            timeout=10
        )
        auth_response.raise_for_status()
        session_data = auth_response.json()
        
        # Check if user exists
        user_doc = await db.users.find_one({"email": session_data["email"]}, {"_id": 0})
        
        if user_doc:
            user = User(**user_doc)
        else:
            # Create new user
            user = User(
                email=session_data["email"],
                name=session_data["name"],
                picture=session_data.get("picture")
            )
            user_dict = user.model_dump()
            user_dict['created_at'] = user_dict['created_at'].isoformat()
            await db.users.insert_one(user_dict)
        
        # Create session
        session_token = session_data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        session = UserSession(
            user_id=user.id,
            session_token=session_token,
            expires_at=expires_at
        )
        
        session_dict = session.model_dump()
        session_dict['expires_at'] = session_dict['expires_at'].isoformat()
        session_dict['created_at'] = session_dict['created_at'].isoformat()
        
        await db.user_sessions.insert_one(session_dict)
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7*24*60*60,
            path="/"
        )
        
        return {"status": "success", "user": user.model_dump()}
    
    except Exception as e:
        logging.error(f"Session processing failed: {e}")
        raise HTTPException(status_code=500, detail="Session processing failed")

@api_router.get("/auth/me")
async def get_me(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get current user"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(
    response: Response,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Logout user"""
    token = session_token or (authorization.replace("Bearer ", "") if authorization else None)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"status": "success"}

@api_router.post("/auth/role")
async def set_role(
    role_data: Dict[str, Any],
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Set user role - can only be set once (patient OR researcher)"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if user already has a role
    if user.roles and len(user.roles) > 0:
        raise HTTPException(status_code=400, detail="Role already set. Cannot change role.")
    
    role = role_data.get("role")
    if role not in ["patient", "researcher"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Set the role (only one role allowed)
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"roles": [role]}}
    )
    
    return {"status": "success", "roles": [role]}

@api_router.get("/auth/check-profile")
async def check_profile(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Check if user has completed profiles for their roles"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = {
        "roles": user.roles,
        "profiles": {}
    }
    
    if "patient" in user.roles:
        patient_profile = await db.patient_profiles.find_one({"user_id": user.id}, {"_id": 0})
        result["profiles"]["patient"] = patient_profile is not None
    
    if "researcher" in user.roles:
        researcher_profile = await db.researcher_profiles.find_one({"user_id": user.id}, {"_id": 0})
        result["profiles"]["researcher"] = researcher_profile is not None
    
    return result

# ============ Patient Endpoints ============

@api_router.post("/patient/profile")
async def create_patient_profile(
    profile_data: ProfileUpdateRequest,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create/update patient profile"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    existing = await db.patient_profiles.find_one({"user_id": user.id}, {"_id": 0})
    
    if existing:
        update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
        await db.patient_profiles.update_one(
            {"user_id": user.id},
            {"$set": update_data}
        )
    else:
        profile = PatientProfile(
            user_id=user.id,
            conditions=profile_data.conditions or [],
            location=profile_data.location,
            interests=profile_data.interests or []
        )
        profile_dict = profile.model_dump()
        profile_dict['created_at'] = profile_dict['created_at'].isoformat()
        await db.patient_profiles.insert_one(profile_dict)
    
    return {"status": "success"}

@api_router.get("/patient/profile")
async def get_patient_profile(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get patient profile"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    profile = await db.patient_profiles.find_one({"user_id": user.id}, {"_id": 0})
    if not profile:
        return None
    
    return profile

@api_router.get("/patient/clinical-trials")
async def get_clinical_trials(
    condition: Optional[str] = None,
    location: Optional[str] = None,
    status: Optional[str] = None,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get clinical trials for patient"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = {}
    if condition:
        query["disease_areas"] = {"$regex": condition, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if status:
        query["status"] = status
    
    trials = await db.clinical_trials.find(query, {"_id": 0}).limit(50).to_list(50)
    return trials

@api_router.get("/patient/experts")
async def get_health_experts(
    specialty: Optional[str] = None,
    location: Optional[str] = None,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get health experts with ratings"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = {}
    if specialty:
        query["specialty"] = {"$regex": specialty, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    experts = await db.health_experts.find(query, {"_id": 0}).limit(50).to_list(50)
    
    # Add ratings for platform members
    for expert in experts:
        if expert.get("is_platform_member") and expert.get("user_id"):
            reviews = await db.reviews.find(
                {"researcher_id": expert["user_id"]},
                {"_id": 0}
            ).to_list(100)
            
            if reviews:
                avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
                expert["average_rating"] = round(avg_rating, 1)
                expert["total_reviews"] = len(reviews)
            else:
                expert["average_rating"] = 0
                expert["total_reviews"] = 0
    
    return experts

@api_router.get("/patient/publications")
async def get_publications(
    disease_area: Optional[str] = None,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get publications"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = {}
    if disease_area:
        query["disease_areas"] = {"$regex": disease_area, "$options": "i"}
    
    publications = await db.publications.find(query, {"_id": 0}).limit(50).to_list(50)
    return publications

@api_router.post("/patient/meeting-request")
async def create_meeting_request(
    request_data: MeetingRequestCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create meeting request with expert"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    meeting_request = MeetingRequest(
        patient_id=user.id,
        expert_id=request_data.expert_id,
        message=request_data.message
    )
    
    request_dict = meeting_request.model_dump()
    request_dict['created_at'] = request_dict['created_at'].isoformat()
    await db.meeting_requests.insert_one(request_dict)
    
    return {"status": "success", "message": "Meeting request sent"}

# ============ Researcher Endpoints ============

@api_router.post("/researcher/profile")
async def create_researcher_profile(
    profile_data: ProfileUpdateRequest,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create/update researcher profile and IMMEDIATELY add to health experts"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Validate required fields
    if not profile_data.age or not profile_data.years_experience or not profile_data.sector or not profile_data.name:
        raise HTTPException(status_code=400, detail="Name, age, experience, and sector are required")
    
    existing = await db.researcher_profiles.find_one({"user_id": user.id}, {"_id": 0})
    
    if existing:
        # Update existing profile
        update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
        await db.researcher_profiles.update_one(
            {"user_id": user.id},
            {"$set": update_data}
        )
        profile = await db.researcher_profiles.find_one({"user_id": user.id}, {"_id": 0})
    else:
        # Create new profile
        profile = ResearcherProfile(
            user_id=user.id,
            name=profile_data.name,
            specialties=profile_data.specialties or [],
            research_interests=profile_data.research_interests or [],
            age=profile_data.age,
            years_experience=profile_data.years_experience,
            sector=profile_data.sector,
            available_hours=profile_data.available_hours or "Flexible",
            orcid=profile_data.orcid,
            researchgate=profile_data.researchgate,
            available_for_meetings=True,
            bio=profile_data.bio or ""
        )
        profile_dict = profile.model_dump()
        profile_dict['created_at'] = profile_dict['created_at'].isoformat()
        await db.researcher_profiles.insert_one(profile_dict)
        profile = profile_dict
    
    # IMMEDIATELY create/update health expert entry
    specialty_display = profile.get("specialties", ["General"])[0] if profile.get("specialties") else profile.get("sector", "General")
    
    expert_data = {
        "name": profile.get("name"),
        "specialty": f"{specialty_display} - {profile.get('sector')}",
        "location": "Global",
        "email": user.email,
        "is_platform_member": True,
        "research_areas": profile.get("research_interests", []),
        "bio": profile.get("bio", ""),
        "user_id": user.id,
        "age": profile.get("age"),
        "years_experience": profile.get("years_experience"),
        "sector": profile.get("sector"),
        "available_hours": profile.get("available_hours", "Flexible")
    }
    
    # Check if expert entry exists
    existing_expert = await db.health_experts.find_one({"user_id": user.id})
    
    if existing_expert:
        # Update existing
        await db.health_experts.update_one(
            {"user_id": user.id},
            {"$set": expert_data}
        )
        logging.info(f"✅ Updated health expert for researcher: {profile.get('name')} (user_id: {user.id})")
    else:
        # Create new expert entry
        expert_data["id"] = str(uuid.uuid4())
        await db.health_experts.insert_one(expert_data)
        logging.info(f"✅ Created NEW health expert: {profile.get('name')} (user_id: {user.id}, expert_id: {expert_data['id']})")
    
    # Verify it was created
    verify = await db.health_experts.find_one({"user_id": user.id})
    if verify:
        logging.info(f"✅ VERIFIED: Expert exists in database with id: {verify.get('id')}")
    else:
        logging.error("❌ ERROR: Expert NOT found in database after creation!")
    
    return {
        "status": "success", 
        "message": "Profile saved and added to Health Experts directory",
        "expert_created": True
    }

@api_router.get("/researcher/profile")
async def get_researcher_profile(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get researcher profile"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    profile = await db.researcher_profiles.find_one({"user_id": user.id}, {"_id": 0})
    if not profile:
        return None
    
    return profile

@api_router.get("/researcher/collaborators")
async def get_collaborators(
    specialty: Optional[str] = None,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get potential collaborators (only visible to researchers)"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if "researcher" not in user.roles:
        raise HTTPException(status_code=403, detail="Only researchers can view collaborators")
    
    query = {"user_id": {"$ne": user.id}}
    if specialty:
        query["specialties"] = {"$regex": specialty, "$options": "i"}
    
    profiles = await db.researcher_profiles.find(query, {"_id": 0}).limit(50).to_list(50)
    
    # Enrich with user data
    for profile in profiles:
        user_doc = await db.users.find_one({"id": profile["user_id"]}, {"_id": 0})
        if user_doc:
            profile["name"] = user_doc.get("name")
            profile["email"] = user_doc.get("email")
            profile["picture"] = user_doc.get("picture")
    
    return profiles

@api_router.post("/researcher/trial")
async def create_trial(
    trial_data: TrialCreateRequest,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create clinical trial"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Generate AI summary
    summary = await generate_ai_summary(f"{trial_data.title}. {trial_data.description}", "clinical trial")
    
    trial = ClinicalTrial(
        title=trial_data.title,
        description=trial_data.description,
        phase=trial_data.phase,
        status=trial_data.status,
        location=trial_data.location,
        eligibility=trial_data.eligibility,
        disease_areas=trial_data.disease_areas,
        contact_email=trial_data.contact_email,
        created_by=user.id,
        summary=summary
    )
    
    trial_dict = trial.model_dump()
    trial_dict['created_at'] = trial_dict['created_at'].isoformat()
    await db.clinical_trials.insert_one(trial_dict)
    
    return {"status": "success", "trial": trial.model_dump()}

@api_router.get("/researcher/trials")
async def get_my_trials(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get researcher's trials"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    trials = await db.clinical_trials.find({"created_by": user.id}, {"_id": 0}).to_list(100)
    return trials

# ============ Common Endpoints ============

@api_router.get("/forums")
async def get_forums(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get all forums with creator info"""
    # Optional auth - returns more info if authenticated
    user = None
    try:
        user = await get_current_user(session_token, authorization)
    except Exception:
        pass
    
    forums = await db.forums.find({}, {"_id": 0}).to_list(100)
    
    # Add is_creator flag if user is authenticated
    if user:
        for forum in forums:
            forum['is_creator'] = forum.get('created_by') == user.id
    
    return forums

@api_router.post("/forums/create")
async def create_forum(
    forum_data: dict,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create a new forum (researchers only)"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if "researcher" not in user.roles:
        raise HTTPException(status_code=403, detail="Only researchers can create forums")
    
    # Validate required fields
    if not all(k in forum_data for k in ['name', 'description', 'category']):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Create forum
    forum = Forum(
        name=forum_data['name'],
        description=forum_data['description'],
        category=forum_data['category'],
        created_by=user.id,
        created_by_name=user.name
    )
    
    forum_dict = forum.model_dump()
    forum_dict['created_at'] = forum_dict['created_at'].isoformat()
    await db.forums.insert_one(forum_dict)
    
    return {"status": "success", "forum": forum.model_dump()}

@api_router.delete("/forums/{forum_id}")
async def delete_forum(
    forum_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Delete a forum (only creator can delete)"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get forum
    forum = await db.forums.find_one({"id": forum_id}, {"_id": 0})
    if not forum:
        raise HTTPException(status_code=404, detail="Forum not found")
    
    # Check if user is the creator
    if forum.get('created_by') != user.id:
        raise HTTPException(status_code=403, detail="Only the forum creator can delete this forum")
    
    # Delete forum
    await db.forums.delete_one({"id": forum_id})
    
    # Delete all posts in this forum
    await db.forum_posts.delete_many({"forum_id": forum_id})
    
    # Delete all memberships
    await db.forum_memberships.delete_many({"forum_id": forum_id})
    
    return {"status": "success", "message": "Forum deleted successfully"}

# Old forum creation endpoint removed - replaced with /forums/create

@api_router.get("/forums/{forum_id}/posts")
async def get_forum_posts(
    forum_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get forum posts"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    posts = await db.forum_posts.find(
        {"forum_id": forum_id, "parent_id": None},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Get replies for each post
    for post in posts:
        replies = await db.forum_posts.find(
            {"forum_id": forum_id, "parent_id": post["id"]},
            {"_id": 0}
        ).sort("created_at", 1).to_list(100)
        post["replies"] = replies
    
    return posts

@api_router.post("/forums/posts")
async def create_forum_post(
    post_data: ForumPostCreateRequest,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create forum post - patients can post freely, researchers need membership"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if user is a member of this forum
    membership = await db.forum_memberships.find_one({
        "forum_id": post_data.forum_id,
        "user_id": user.id
    })
    
    if not membership:
        raise HTTPException(
            status_code=403, 
            detail="You must join this forum group first to participate in discussions."
        )
    
    # For patients: allow unlimited posting and commenting (no restrictions)
    # For researchers: must have membership with matching specialty to post/comment
    if "researcher" in user.roles:
        # Membership already validated above - researcher has matching specialty
        pass
    
    user_role = "researcher" if "researcher" in user.roles else "patient"
    
    post = ForumPost(
        forum_id=post_data.forum_id,
        user_id=user.id,
        user_name=user.name,
        user_role=user_role,
        content=post_data.content,
        parent_id=post_data.parent_id,
        image_url=post_data.image_url
    )
    
    post_dict = post.model_dump()
    post_dict['created_at'] = post_dict['created_at'].isoformat()
    await db.forum_posts.insert_one(post_dict)
    
    # Update forum post count
    if not post_data.parent_id:
        await db.forums.update_one(
            {"id": post_data.forum_id},
            {"$inc": {"post_count": 1}}
        )
    
    return {"status": "success", "post": post.model_dump()}

# ============ Forum Membership Endpoints ============

@api_router.post("/forums/{forum_id}/join")
async def join_forum_group(
    forum_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Join a forum group - Patients can join any forum, researchers need matching specialty"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get forum details
    forum = await db.forums.find_one({"id": forum_id}, {"_id": 0})
    if not forum:
        raise HTTPException(status_code=404, detail="Forum not found")
    
    # Check if already a member
    existing = await db.forum_memberships.find_one({
        "forum_id": forum_id,
        "user_id": user.id
    })
    
    if existing:
        return {"status": "already_member", "message": "Already a member of this group"}
    
    # For patients - allow joining any forum
    if "patient" in user.roles:
        membership = ForumMembership(
            forum_id=forum_id,
            forum_name=forum["name"],
            user_id=user.id,
            user_name=user.name,
            specialty="Patient"  # Patients don't have specialties
        )
        
        membership_dict = membership.model_dump()
        membership_dict['joined_at'] = membership_dict['joined_at'].isoformat()
        await db.forum_memberships.insert_one(membership_dict)
        
        return {"status": "success", "message": "Successfully joined the group"}
    
    # For researchers - check specialty matching
    if "researcher" in user.roles:
        researcher = await db.researcher_profiles.find_one({"user_id": user.id}, {"_id": 0})
        if not researcher:
            raise HTTPException(status_code=404, detail="Researcher profile not found")
        
        # Check if researcher's specialty matches forum category
        forum_category = forum.get("category", "").lower()
        researcher_specialties = [s.lower() for s in researcher.get("specialties", [])]
        
        # Simple matching logic - can be made more sophisticated
        has_matching_specialty = any(
            specialty in forum_category or forum_category in specialty
            for specialty in researcher_specialties
        )
        
        if not has_matching_specialty:
            raise HTTPException(
                status_code=403, 
                detail=f"Your specialties do not match this forum's category ({forum['category']}). You can view but not post in this group."
            )
        
        # Create membership
        membership = ForumMembership(
            forum_id=forum_id,
            forum_name=forum["name"],
            user_id=user.id,
            user_name=user.name,
            specialty=", ".join(researcher["specialties"][:2])  # First 2 specialties
        )
        
        membership_dict = membership.model_dump()
        membership_dict['joined_at'] = membership_dict['joined_at'].isoformat()
        await db.forum_memberships.insert_one(membership_dict)
        
        return {"status": "success", "message": "Successfully joined the group"}
    
    raise HTTPException(status_code=403, detail="Invalid user role")

@api_router.delete("/forums/{forum_id}/leave")
async def leave_forum_group(
    forum_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Leave a forum group"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.forum_memberships.delete_one({
        "forum_id": forum_id,
        "user_id": user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    return {"status": "success", "message": "Successfully left the group"}

@api_router.get("/forums/{forum_id}/membership")
async def check_forum_membership(
    forum_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Check if user is a member of this forum"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    membership = await db.forum_memberships.find_one({
        "forum_id": forum_id,
        "user_id": user.id
    }, {"_id": 0})
    
    return {
        "is_member": membership is not None,
        "membership": membership
    }

@api_router.get("/forums/{forum_id}/members")
async def get_forum_members(
    forum_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get all members of a forum group"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    members = await db.forum_memberships.find(
        {"forum_id": forum_id},
        {"_id": 0}
    ).to_list(100)
    
    return {"members": members, "count": len(members)}

# ============ Q&A Community Endpoints ============

@api_router.post("/qa/questions")
async def create_question(
    question_data: QuestionCreateRequest,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create a question (patients only)"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if "patient" not in user.roles:
        raise HTTPException(status_code=403, detail="Only patients can ask questions")
    
    question = Question(
        patient_id=user.id,
        title=question_data.title,
        content=question_data.content,
        condition=question_data.condition,
        is_anonymous=question_data.is_anonymous
    )
    
    question_dict = question.model_dump()
    question_dict['created_at'] = question_dict['created_at'].isoformat()
    await db.questions.insert_one(question_dict)
    
    return {"status": "success", "question": question.model_dump()}

@api_router.get("/qa/questions")
async def get_questions(
    condition: Optional[str] = None,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get all questions (public for authenticated users)"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = {}
    if condition:
        query["condition"] = {"$regex": condition, "$options": "i"}
    
    questions = await db.questions.find(query, {"_id": 0, "patient_id": 0}).sort("created_at", -1).to_list(100)
    
    # Get answer counts for each question
    for question in questions:
        answer_count = await db.answers.count_documents({"question_id": question["id"], "parent_id": None})
        question["answer_count"] = answer_count
    
    return questions

@api_router.get("/qa/questions/{question_id}")
async def get_question_detail(
    question_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get question with all answers and replies"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    question = await db.questions.find_one({"id": question_id}, {"_id": 0, "patient_id": 0})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Get all answers (not replies)
    answers = await db.answers.find(
        {"question_id": question_id, "parent_id": None},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Get user's votes
    user_votes = {}
    votes = await db.votes.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    for vote in votes:
        user_votes[vote["answer_id"]] = vote["vote_type"]
    
    # Get replies for each answer
    for answer in answers:
        answer["user_vote"] = user_votes.get(answer["id"])
        
        replies = await db.answers.find(
            {"question_id": question_id, "parent_id": answer["id"]},
            {"_id": 0}
        ).sort("created_at", 1).to_list(100)
        
        # Add user votes for replies
        for reply in replies:
            reply["user_vote"] = user_votes.get(reply["id"])
        
        answer["replies"] = replies
    
    question["answers"] = answers
    
    return question

@api_router.post("/qa/answers")
async def create_answer(
    answer_data: AnswerCreateRequest,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create an answer or reply (researchers only)"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if "researcher" not in user.roles:
        raise HTTPException(status_code=403, detail="Only researchers can answer")
    
    # Get researcher profile for specialty
    researcher_profile = await db.researcher_profiles.find_one({"user_id": user.id}, {"_id": 0})
    specialty = None
    if researcher_profile and researcher_profile.get("specialties"):
        specialty = researcher_profile["specialties"][0]
    
    answer = Answer(
        question_id=answer_data.question_id,
        researcher_id=user.id,
        researcher_name=user.name,
        researcher_specialty=specialty,
        content=answer_data.content,
        parent_id=answer_data.parent_id
    )
    
    answer_dict = answer.model_dump()
    answer_dict['created_at'] = answer_dict['created_at'].isoformat()
    await db.answers.insert_one(answer_dict)
    
    return {"status": "success", "answer": answer.model_dump()}

@api_router.post("/qa/vote")
async def vote_answer(
    vote_data: VoteRequest,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Vote on an answer (like/dislike)"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if vote_data.vote_type not in ["like", "dislike"]:
        raise HTTPException(status_code=400, detail="Invalid vote type")
    
    # Check if user already voted
    existing_vote = await db.votes.find_one({
        "answer_id": vote_data.answer_id,
        "user_id": user.id
    })
    
    if existing_vote:
        # Update vote
        old_vote = existing_vote["vote_type"]
        if old_vote != vote_data.vote_type:
            # Change vote
            await db.votes.update_one(
                {"answer_id": vote_data.answer_id, "user_id": user.id},
                {"$set": {"vote_type": vote_data.vote_type}}
            )
            
            # Update answer counts
            if old_vote == "like":
                await db.answers.update_one(
                    {"id": vote_data.answer_id},
                    {"$inc": {"likes": -1, "dislikes": 1}}
                )
            else:
                await db.answers.update_one(
                    {"id": vote_data.answer_id},
                    {"$inc": {"likes": 1, "dislikes": -1}}
                )
        else:
            # Remove vote
            await db.votes.delete_one({
                "answer_id": vote_data.answer_id,
                "user_id": user.id
            })
            
            # Update answer counts
            if vote_data.vote_type == "like":
                await db.answers.update_one(
                    {"id": vote_data.answer_id},
                    {"$inc": {"likes": -1}}
                )
            else:
                await db.answers.update_one(
                    {"id": vote_data.answer_id},
                    {"$inc": {"dislikes": -1}}
                )
    else:
        # New vote
        vote = Vote(
            answer_id=vote_data.answer_id,
            user_id=user.id,
            vote_type=vote_data.vote_type
        )
        
        vote_dict = vote.model_dump()
        vote_dict['created_at'] = vote_dict['created_at'].isoformat()
        await db.votes.insert_one(vote_dict)
        
        # Update answer counts
        if vote_data.vote_type == "like":
            await db.answers.update_one(
                {"id": vote_data.answer_id},
                {"$inc": {"likes": 1}}
            )
        else:
            await db.answers.update_one(
                {"id": vote_data.answer_id},
                {"$inc": {"dislikes": 1}}
            )
    
    return {"status": "success"}

@api_router.get("/favorites")
async def get_favorites(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get user favorites"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    favorites = await db.favorites.find({"user_id": user.id}, {"_id": 0}).to_list(100)
    
    # Enrich with actual items
    enriched = []
    for fav in favorites:
        item = None
        if fav["item_type"] == "trial":
            item = await db.clinical_trials.find_one({"id": fav["item_id"]}, {"_id": 0})
        elif fav["item_type"] == "publication":
            item = await db.publications.find_one({"id": fav["item_id"]}, {"_id": 0})
        elif fav["item_type"] == "expert":
            item = await db.health_experts.find_one({"id": fav["item_id"]}, {"_id": 0})
        elif fav["item_type"] == "collaborator":
            item = await db.researcher_profiles.find_one({"user_id": fav["item_id"]}, {"_id": 0})
        
        if item:
            enriched.append({
                "favorite_id": fav["id"],
                "item_type": fav["item_type"],
                "item": item
            })
    
    return enriched

@api_router.post("/favorites")
async def add_favorite(
    favorite_data: FavoriteCreateRequest,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Add to favorites"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if already favorited
    existing = await db.favorites.find_one({
        "user_id": user.id,
        "item_type": favorite_data.item_type,
        "item_id": favorite_data.item_id
    })
    
    if existing:
        return {"status": "already_favorited"}
    
    favorite = Favorite(
        user_id=user.id,
        item_type=favorite_data.item_type,
        item_id=favorite_data.item_id
    )
    
    favorite_dict = favorite.model_dump()
    favorite_dict['created_at'] = favorite_dict['created_at'].isoformat()
    await db.favorites.insert_one(favorite_dict)
    
    return {"status": "success"}

@api_router.delete("/favorites/{favorite_id}")
async def remove_favorite(
    favorite_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Remove from favorites"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    await db.favorites.delete_one({"id": favorite_id, "user_id": user.id})
    return {"status": "success"}

# ============ Appointment System Endpoints ============

@api_router.post("/appointments/request")
async def create_appointment_request(
    request_data: AppointmentRequestCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create appointment request (patients only)"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if "patient" not in user.roles:
        raise HTTPException(status_code=403, detail="Only patients can request appointments")
    
    # Create appointment request
    appointment = AppointmentRequest(
        patient_id=user.id,
        patient_name=request_data.patient_name,
        researcher_id=request_data.researcher_id,
        condition=request_data.condition,
        location=request_data.location,
        duration_suffering=request_data.duration_suffering
    )
    
    appointment_dict = appointment.model_dump()
    appointment_dict['created_at'] = appointment_dict['created_at'].isoformat()
    await db.appointments.insert_one(appointment_dict)
    
    # Create notification for researcher
    researcher = await db.users.find_one({"id": request_data.researcher_id}, {"_id": 0})
    if researcher:
        notification = Notification(
            user_id=request_data.researcher_id,
            type="appointment_request",
            title="New Appointment Request",
            content=f"{request_data.patient_name} has requested an appointment for {request_data.condition}",
            link="/notifications"
        )
        notif_dict = notification.model_dump()
        notif_dict['created_at'] = notif_dict['created_at'].isoformat()
        await db.notifications.insert_one(notif_dict)
    
    return {"status": "success", "appointment": appointment.model_dump()}

@api_router.get("/appointments")
async def get_appointments(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get user's appointments"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = {}
    if "patient" in user.roles:
        query["patient_id"] = user.id
    elif "researcher" in user.roles:
        query["researcher_id"] = user.id
    
    appointments = await db.appointments.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return appointments

@api_router.post("/appointments/{appointment_id}/accept")
async def accept_appointment(
    appointment_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Accept appointment request (researchers only)"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if "researcher" not in user.roles:
        raise HTTPException(status_code=403, detail="Only researchers can accept appointments")
    
    appointment = await db.appointments.find_one({"id": appointment_id, "researcher_id": user.id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Update appointment status
    await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"status": "accepted"}}
    )
    
    # Create chat room
    chat_room = ChatRoom(
        appointment_id=appointment_id,
        patient_id=appointment["patient_id"],
        researcher_id=user.id
    )
    
    room_dict = chat_room.model_dump()
    room_dict['created_at'] = room_dict['created_at'].isoformat()
    await db.chat_rooms.insert_one(room_dict)
    
    # ✅ CREATE NOTIFICATION FOR PATIENT
    notification = Notification(
        user_id=appointment["patient_id"],
        type="appointment_accepted",
        title="Appointment Accepted!",
        content="Your appointment request has been accepted. You can now join the consultation.",
        link=f"/chat/{chat_room.id}"
    )
    notif_dict = notification.model_dump()
    notif_dict['created_at'] = notif_dict['created_at'].isoformat()
    await db.notifications.insert_one(notif_dict)
    
    logging.info(f"✅ Chat room created: {chat_room.id} for patient {appointment['patient_id']}")
    logging.info(f"✅ Notification sent to patient {appointment['patient_id']}")
    
    return {"status": "success", "chat_room_id": chat_room.id}

@api_router.post("/appointments/{appointment_id}/reject")
async def reject_appointment(
    appointment_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Reject appointment request (researchers only)"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if "researcher" not in user.roles:
        raise HTTPException(status_code=403, detail="Only researchers can reject appointments")
    
    await db.appointments.update_one(
        {"id": appointment_id, "researcher_id": user.id},
        {"$set": {"status": "rejected"}}
    )
    
    return {"status": "success"}

# ============ Notification Endpoints ============

@api_router.get("/notifications")
async def get_notifications(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get user notifications"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    notifications = await db.notifications.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return notifications

@api_router.post("/notifications/read")
async def mark_notification_read(
    notif_data: NotificationRead,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Mark notification as read"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    await db.notifications.update_one(
        {"id": notif_data.notification_id, "user_id": user.id},
        {"$set": {"read": True}}
    )
    
    return {"status": "success"}

@api_router.get("/notifications/unread-count")
async def get_unread_count(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get unread notification count"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    count = await db.notifications.count_documents({"user_id": user.id, "read": False})
    return {"count": count}

# ============ Chat Room Endpoints ============

@api_router.get("/chat-rooms")
async def get_chat_rooms(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get user's chat rooms"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = {"status": "active"}
    if "patient" in user.roles:
        query["patient_id"] = user.id
    elif "researcher" in user.roles:
        query["researcher_id"] = user.id
    
    rooms = await db.chat_rooms.find(query, {"_id": 0}).to_list(100)
    
    # Enrich with appointment and user data
    for room in rooms:
        appointment = await db.appointments.find_one({"id": room["appointment_id"]}, {"_id": 0})
        if appointment:
            room["appointment"] = appointment
        
        # Get other user info
        other_user_id = room["researcher_id"] if "patient" in user.roles else room["patient_id"]
        other_user = await db.users.find_one({"id": other_user_id}, {"_id": 0})
        if other_user:
            room["other_user"] = {
                "id": other_user["id"],
                "name": other_user["name"],
                "picture": other_user.get("picture")
            }
    
    return rooms

@api_router.get("/chat-rooms/{room_id}/messages")
async def get_chat_messages(
    room_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get chat messages"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Verify user has access to this chat room
    room = await db.chat_rooms.find_one({"id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    if room["patient_id"] != user.id and room["researcher_id"] != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    messages = await db.chat_messages.find(
        {"chat_room_id": room_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    return messages

@api_router.post("/chat-rooms/{room_id}/messages")
async def send_chat_message(
    room_id: str,
    message_data: ChatMessageCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Send chat message"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Verify user has access
    room = await db.chat_rooms.find_one({"id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    if room["patient_id"] != user.id and room["researcher_id"] != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if room["status"] != "active":
        raise HTTPException(status_code=400, detail="Chat room is closed")
    
    # Create message
    user_role = "researcher" if "researcher" in user.roles else "patient"
    message = ChatMessage(
        chat_room_id=room_id,
        sender_id=user.id,
        sender_name=user.name,
        sender_role=user_role,
        message_type=message_data.message_type,
        content=message_data.content
    )
    
    msg_dict = message.model_dump()
    msg_dict['created_at'] = msg_dict['created_at'].isoformat()
    await db.chat_messages.insert_one(msg_dict)
    
    return {"status": "success", "message": message.model_dump()}

@api_router.post("/chat-rooms/{room_id}/close")
async def close_chat_room(
    room_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Close chat room and delete messages"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Verify user has access
    room = await db.chat_rooms.find_one({"id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    if room["patient_id"] != user.id and room["researcher_id"] != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Close room
    await db.chat_rooms.update_one(
        {"id": room_id},
        {"$set": {"status": "closed", "closed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Mark appointment as completed
    await db.appointments.update_one(
        {"id": room["appointment_id"]},
        {"$set": {"status": "completed"}}
    )
    
    # Delete all messages
    await db.chat_messages.delete_many({"chat_room_id": room_id})
    
    return {"status": "success"}

# ============ Review Endpoints ============

@api_router.post("/reviews")
async def create_review(
    review_data: ReviewCreate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create review (patients only)"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if "patient" not in user.roles:
        raise HTTPException(status_code=403, detail="Only patients can leave reviews")
    
    # Get appointment
    appointment = await db.appointments.find_one({"id": review_data.appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment["patient_id"] != user.id:
        raise HTTPException(status_code=403, detail="Not your appointment")
    
    if appointment["status"] != "completed":
        raise HTTPException(status_code=400, detail="Appointment not completed yet")
    
    # Create review
    review = Review(
        appointment_id=review_data.appointment_id,
        patient_id=user.id,
        researcher_id=appointment["researcher_id"],
        rating=review_data.rating,
        comment=review_data.comment
    )
    
    review_dict = review.model_dump()
    review_dict['created_at'] = review_dict['created_at'].isoformat()
    await db.reviews.insert_one(review_dict)
    
    # Create notification for researcher
    notification = Notification(
        user_id=appointment["researcher_id"],
        type="review_received",
        title="New Review Received",
        content=f"You received a {review_data.rating}-star review from a patient",
        link="/notifications"
    )
    notif_dict = notification.model_dump()
    notif_dict['created_at'] = notif_dict['created_at'].isoformat()
    await db.notifications.insert_one(notif_dict)
    
    return {"status": "success", "review": review.model_dump()}

@api_router.get("/reviews/researcher/{researcher_id}")
async def get_researcher_reviews(
    researcher_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get reviews for a researcher"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    reviews = await db.reviews.find(
        {"researcher_id": researcher_id},
        {"_id": 0, "patient_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Calculate average rating
    if reviews:
        avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    else:
        avg_rating = 0
    
    return {
        "reviews": reviews,
        "average_rating": round(avg_rating, 1),
        "total_reviews": len(reviews)
    }

# ============ Seed Data Endpoint ============

@api_router.post("/seed")
async def seed_data():
    """Seed initial data"""
    # Seed clinical trials
    trials_sample = [
        {
            "id": str(uuid.uuid4()),
            "title": "Immunotherapy for Advanced Lung Cancer",
            "description": "A Phase III study evaluating the efficacy of combination immunotherapy in patients with advanced non-small cell lung cancer.",
            "phase": "Phase III",
            "status": "Recruiting",
            "location": "Boston, MA, USA",
            "eligibility": "Adults 18+ with stage IV NSCLC",
            "disease_areas": ["Lung Cancer", "Oncology"],
            "contact_email": "trials@example.com",
            "summary": "This trial tests a new immunotherapy combination for advanced lung cancer patients.",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "CAR-T Cell Therapy for Glioblastoma",
            "description": "Evaluating CAR-T cell therapy targeting EGFRvIII in patients with recurrent glioblastoma.",
            "phase": "Phase I/II",
            "status": "Recruiting",
            "location": "San Francisco, CA, USA",
            "eligibility": "Adults with recurrent GBM and EGFRvIII expression",
            "disease_areas": ["Brain Cancer", "Glioblastoma", "Oncology"],
            "contact_email": "gbm-trial@example.com",
            "summary": "CAR-T therapy study for brain cancer patients with specific genetic markers.",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for trial in trials_sample:
        existing = await db.clinical_trials.find_one({"title": trial["title"]})
        if not existing:
            await db.clinical_trials.insert_one(trial)
    
    # Seed publications
    publications_sample = [
        {
            "id": str(uuid.uuid4()),
            "title": "Novel Immunotherapy Approaches in Oncology",
            "authors": ["Dr. Sarah Johnson", "Dr. Michael Chen", "Dr. Emily Rodriguez"],
            "abstract": "This comprehensive review examines the latest advances in cancer immunotherapy, including checkpoint inhibitors, CAR-T cells, and combination therapies.",
            "journal": "Nature Medicine",
            "year": 2024,
            "doi": "10.1038/nm.2024.001",
            "disease_areas": ["Oncology", "Immunotherapy"],
            "url": "https://www.nature.com/articles/example",
            "summary": "Comprehensive review of cutting-edge cancer immunotherapy treatments and their clinical outcomes.",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Glioma Treatment: Current Status and Future Directions",
            "authors": ["Dr. Robert Thompson", "Dr. Lisa Anderson"],
            "abstract": "An overview of current treatment strategies for glioma and emerging therapeutic approaches including targeted therapy and immunotherapy.",
            "journal": "Journal of Clinical Oncology",
            "year": 2024,
            "doi": "10.1200/jco.2024.002",
            "disease_areas": ["Brain Cancer", "Glioma", "Oncology"],
            "url": "https://ascopubs.org/example",
            "summary": "Review of glioma treatments including surgery, radiation, and novel targeted therapies.",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for pub in publications_sample:
        existing = await db.publications.find_one({"title": pub["title"]})
        if not existing:
            await db.publications.insert_one(pub)
    
    # Seed health experts
    experts_sample = [
        {
            "id": str(uuid.uuid4()),
            "name": "Dr. Sarah Johnson",
            "specialty": "Oncology - Immunotherapy",
            "location": "Boston, MA, USA",
            "email": "s.johnson@hospital.com",
            "is_platform_member": True,
            "research_areas": ["Immunotherapy", "Lung Cancer", "Clinical Trials"],
            "bio": "Leading expert in cancer immunotherapy with 15+ years of experience."
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Dr. Michael Chen",
            "specialty": "Neuro-oncology",
            "location": "San Francisco, CA, USA",
            "email": "m.chen@medcenter.com",
            "is_platform_member": False,
            "research_areas": ["Glioblastoma", "Brain Tumors", "CAR-T Therapy"],
            "bio": "Specialist in brain cancer treatment and novel cellular therapies."
        }
    ]
    
    for expert in experts_sample:
        existing = await db.health_experts.find_one({"name": expert["name"]})
        if not existing:
            await db.health_experts.insert_one(expert)
    
    # Seed forums
    forums_sample = [
        {
            "id": str(uuid.uuid4()),
            "name": "Cancer Research Insights",
            "description": "Discuss latest developments in cancer research and treatment",
            "category": "Oncology",
            "created_by": "system",
            "post_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Clinical Trials Discussion",
            "description": "Questions and answers about clinical trial participation",
            "category": "Clinical Trials",
            "created_by": "system",
            "post_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for forum in forums_sample:
        existing = await db.forums.find_one({"name": forum["name"]})
        if not existing:
            await db.forums.insert_one(forum)
    
    return {"status": "success", "message": "Data seeded"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()