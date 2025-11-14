# CuraLink Authentication Code Reference

## Authentication Flow

### 1. User Clicks "Sign In" Button
- Frontend redirects to Google OAuth via Emergent Auth
- URL: `https://auth.emergentagent.com/?redirect=<app_url>`

### 2. Google OAuth Returns with session_id
- User is redirected back with: `#session_id=<token>`
- Frontend detects this in URL hash and calls `processSession(sessionId)`

### 3. Frontend processSession() - Line 54
```javascript
const processSession = async (sessionId) => {
  try {
    // Send session_id to backend
    const response = await api.post('/auth/session', { session_id: sessionId });
    
    // Store user in React state
    setUser(response.data.user);
    
    // Redirect based on role
    if (response.data.user.roles && response.data.user.roles.length > 0) {
      navigate('/dashboard');
    } else {
      navigate('/onboarding');
    }
  } catch (error) {
    console.error('Session processing failed:', error);
    navigate('/');
  }
};
```

### 4. Backend POST /auth/session - Line 568
```python
@api_router.post("/auth/session")
async def process_session(data: SessionDataRequest, response: Response):
    # Step 1: Call Emergent Auth to validate session_id
    auth_response = requests.get(
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        headers={"X-Session-ID": data.session_id}
    )
    session_data = auth_response.json()
    # Returns: {email, name, picture, session_token}
    
    # Step 2: Find or create user by email
    user_doc = await db.users.find_one({"email": session_data["email"]})
    if user_doc:
        user = User(**user_doc)
    else:
        # Create new user
        user = User(
            email=session_data["email"],
            name=session_data["name"],
            picture=session_data.get("picture")
        )
        await db.users.insert_one(user.model_dump())
    
    # Step 3: Delete old sessions for this user
    await db.user_sessions.delete_many({"user_id": user.id})
    
    # Step 4: Create new session
    session = UserSession(
        user_id=user.id,
        session_token=session_data["session_token"],
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    await db.user_sessions.insert_one(session.model_dump())
    
    # Step 5: Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_data["session_token"],
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60
    )
    
    # Step 6: Return user data
    return {"status": "success", "user": user.model_dump()}
```

### 5. Subsequent Requests - get_current_user() - Line 522
```python
async def get_current_user(session_token: str = None, authorization: str = None):
    # Get token from cookie or Authorization header
    token = session_token or (authorization.replace("Bearer ", "") if authorization else None)
    
    # Find session in database
    session = await db.user_sessions.find_one({"session_token": token})
    if not session:
        return None
    
    # Check if expired
    if session['expires_at'] < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": token})
        return None
    
    # Get user from database
    user_doc = await db.users.find_one({"id": session["user_id"]})
    return User(**user_doc)
```

### 6. Frontend checkAuth() - Line 75
```javascript
const checkAuth = async () => {
  try {
    const response = await api.get('/auth/me', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    setUser(response.data);  // Store user in React state
    console.log('Auth check: User logged in as', response.data.email);
  } catch (error) {
    setUser(null);
  }
};
```

### 7. Backend GET /auth/me - Line 705
```python
@api_router.get("/auth/me")
async def get_me(session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(session_token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user  # Returns User object with email, name, roles, etc.
```

## Database Collections

### users
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "picture": "https://...",
  "roles": ["patient" or "researcher"],
  "created_at": "2025-11-14T..."
}
```

### user_sessions
```json
{
  "user_id": "uuid (matches users.id)",
  "session_token": "token_from_emergent_auth",
  "expires_at": "2025-11-21T...",
  "created_at": "2025-11-14T..."
}
```

## Key Points

1. **Session Token Storage**: 
   - Stored in httpOnly cookie (name: `session_token`)
   - Also available via Authorization header (`Bearer <token>`)

2. **User Identification**:
   - session_token → user_sessions.session_token → user_sessions.user_id → users.id → User
   - Email is used to find/create users initially
   - user_id is used for all subsequent lookups

3. **Security**:
   - httpOnly cookies prevent JavaScript access
   - Tokens validated on every request via `get_current_user()`
   - Sessions expire after 7 days
   - Old sessions deleted when new login occurs

4. **Common Issues**:
   - **Stale cookies**: Browser holds old session_token cookie
   - **Cache**: Frontend React state caching old user
   - **Database mismatch**: session_token points to wrong user_id
   - **Cookie not sent**: axios must use `withCredentials: true`
