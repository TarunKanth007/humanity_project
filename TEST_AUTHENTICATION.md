# Test Authentication - Step by Step

Please follow these steps to help me diagnose the issue:

## Step 1: Clear Everything
1. Open browser Developer Tools (F12)
2. Go to Application/Storage tab
3. Clear all cookies for emergentagent.com
4. Clear all Local Storage
5. Close all browser tabs with CuraLink

## Step 2: Test Login
1. Open a NEW browser tab
2. Go to: https://researchportal-2.preview.emergentagent.com
3. Click "Sign In"
4. **BEFORE clicking a Google account, take a screenshot of what Google shows you**
5. Which email options does Google show?
6. Which email do you select?

## Step 3: Check Logs
After logging in, I need you to tell me:
1. Which email did YOU select in Google?
2. Which email is shown in the CuraLink app after login?

## Step 4: Backend Logs
While you're testing, I'll monitor the backend logs in real-time to see:
- What session_id is received
- What email Emergent Auth returns
- Which user account is retrieved

## For Testing on Different Device:
1. Use a device you've NEVER used CuraLink on before
2. Make sure you're NOT logged into Google, or use Incognito
3. Try logging in with an email like movvatarun77@gmail.com
4. Tell me what happens

## Current Backend State:
- All sessions cleared
- 3 users in database:
  - tarunganes1@gmail.com
  - tarunkanthmovva007@gmail.com
  - movvatarun77@gmail.com
- Enhanced logging active to track exact flow

## What I'm Looking For:
The backend logs will show:
```
AUTH: Session ID received: [actual session_id from Google]
AUTH: Processing login for email: [email from Emergent Auth]
AUTH: Session token from Emergent: [token from Emergent Auth]
AUTH: Found existing user - Email: [email that was matched]
```

This will tell us if:
A) Google OAuth is returning the wrong email
B) Emergent Auth is returning the wrong email  
C) Our backend is matching to the wrong user

Please try this and let me know what you see!
