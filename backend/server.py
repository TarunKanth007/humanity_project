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
    specialties: List[str] = []
    research_interests: List[str] = []
    orcid: Optional[str] = None
    researchgate: Optional[str] = None
    available_for_meetings: bool = False
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
    created_by: str
    post_count: int = 0
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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    specialties: Optional[List[str]] = None
    research_interests: Optional[List[str]] = None
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
        auth_response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
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
    """Add role to user (patient and/or researcher)"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    role = role_data.get("role")
    if role not in ["patient", "researcher"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Get current roles
    user_doc = await db.users.find_one({"id": user.id}, {"_id": 0})
    current_roles = user_doc.get("roles", [])
    
    # Add role if not already present
    if role not in current_roles:
        current_roles.append(role)
        await db.users.update_one(
            {"id": user.id},
            {"$set": {"roles": current_roles}}
        )
    
    return {"status": "success", "roles": current_roles}

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
    """Get health experts"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = {}
    if specialty:
        query["specialty"] = {"$regex": specialty, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    experts = await db.health_experts.find(query, {"_id": 0}).limit(50).to_list(50)
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
    """Create/update researcher profile"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    existing = await db.researcher_profiles.find_one({"user_id": user.id}, {"_id": 0})
    
    if existing:
        update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
        await db.researcher_profiles.update_one(
            {"user_id": user.id},
            {"$set": update_data}
        )
    else:
        profile = ResearcherProfile(
            user_id=user.id,
            specialties=profile_data.specialties or [],
            research_interests=profile_data.research_interests or [],
            orcid=profile_data.orcid,
            researchgate=profile_data.researchgate,
            available_for_meetings=profile_data.available_for_meetings or False,
            bio=profile_data.bio
        )
        profile_dict = profile.model_dump()
        profile_dict['created_at'] = profile_dict['created_at'].isoformat()
        await db.researcher_profiles.insert_one(profile_dict)
    
    return {"status": "success"}

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
    """Get potential collaborators"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
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
    category: Optional[str] = None,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get forums"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = {}
    if category:
        query["category"] = category
    
    forums = await db.forums.find(query, {"_id": 0}).to_list(100)
    return forums

@api_router.post("/forums")
async def create_forum(
    forum_data: ForumCreateRequest,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Create forum (researchers only)"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user.role != "researcher":
        raise HTTPException(status_code=403, detail="Only researchers can create forums")
    
    forum = Forum(
        name=forum_data.name,
        description=forum_data.description,
        category=forum_data.category,
        created_by=user.id
    )
    
    forum_dict = forum.model_dump()
    forum_dict['created_at'] = forum_dict['created_at'].isoformat()
    await db.forums.insert_one(forum_dict)
    
    return {"status": "success", "forum": forum.model_dump()}

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
    """Create forum post"""
    user = await get_current_user(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if reply and user is patient
    if post_data.parent_id and user.role == "patient":
        raise HTTPException(status_code=403, detail="Patients cannot reply to posts")
    
    post = ForumPost(
        forum_id=post_data.forum_id,
        user_id=user.id,
        user_name=user.name,
        user_role=user.role or "user",
        content=post_data.content,
        parent_id=post_data.parent_id
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