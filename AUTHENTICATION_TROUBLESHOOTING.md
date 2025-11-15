# Authentication Troubleshooting Guide

## Issue: Always Logging In As Same User

### Root Cause
Google OAuth uses the **currently signed-in Google account** in your browser. If you're signed into Google with `tarunkanthmovva007@gmail.com`, clicking "Sign in with Google" will always use that account.

### Solutions

#### 1. Sign Out of Google First
Before trying to log in with a different email:
1. Go to https://accounts.google.com
2. Click your profile picture → Sign out
3. Go back to CuraLink
4. Click "Sign In"
5. Choose "Use another account"
6. Enter the email you want to use

#### 2. Use Incognito/Private Window
- Open a new incognito/private browsing window
- Go to CuraLink
- Sign in with the desired Google account
- This won't interfere with your main browser session

#### 3. Use Different Browser Profiles
- Chrome/Edge: Create a new Profile (top-right corner)
- Firefox: Use Container Tabs
- Each profile has its own Google login

#### 4. Force Account Picker
When clicking "Sign In", Google should show an account picker. If it doesn't:
- Clear browser cookies for `emergentagent.com`
- Clear browser cookies for `google.com`
- Try signing in again

### Admin: Clear All Sessions
If you need to force all users to re-login:
```bash
curl -X POST https://researchportal-2.preview.emergentagent.com/api/auth/clear-all-sessions
```

### Testing Authentication
To verify the backend is working correctly:

1. **Check Current User**:
```bash
curl https://researchportal-2.preview.emergentagent.com/api/auth/me
# Should return 401 if not logged in
```

2. **Check Database Users**:
```bash
# Connect to MongoDB and run:
db.users.find({}, {email: 1, name: 1})
```

3. **Check Active Sessions**:
```bash
# Connect to MongoDB and run:
db.user_sessions.find({}, {user_id: 1, expires_at: 1})
```

### Backend Enhancements Applied

1. ✅ Removed duplicate user accounts
2. ✅ Created unique index on email field
3. ✅ Added email validation in session creation
4. ✅ Enhanced logging to track session_id → email mapping
5. ✅ Improved logout to clear all cookies
6. ✅ Added security checks to prevent session/user mismatches

### Expected Behavior

- Each email maps to exactly ONE user account
- Logging in with email A shows data for user A only
- Logging out clears session completely
- Cannot create duplicate users with same email

### If Issue Persists

Check backend logs for these messages:
```
AUTH: Session ID received: [session_id]
AUTH: Processing login for email: [email]
AUTH: Session token from Emergent: [token]
AUTH: Found existing user - ID: [user_id], Email: [email]
```

If the email shown doesn't match what you expected, it means Google OAuth returned a different account.
