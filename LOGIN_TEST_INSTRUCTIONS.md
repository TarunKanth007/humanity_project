# 🧪 Login Authentication Test

## Current State (VERIFIED ✅)
- All sessions cleared
- 5 users in database (no duplicates)
- `prompt=select_account` already applied
- Unique index on session_token enforced
- Duplicate token detection active

## Test Instructions

### Test 1: Fresh Login
1. Open **incognito/private window**
2. Go to: https://trialbridge.preview.emergentagent.com
3. Click **"Sign In"** button
4. **EXPECTED:** You should see Google account picker (not auto-login)
5. Select an account (e.g., tarunmovva1@gmail.com)
6. **EXPECTED:** Dashboard shows the email you selected
7. **VERIFY:** Profile shows YOUR data, not someone else's

### Test 2: Account Switching
1. In the same window, logout
2. Click "Sign In" again
3. **EXPECTED:** Google account picker appears again
4. Select a DIFFERENT account (e.g., tarunmovva2@gmail.com)
5. **EXPECTED:** Dashboard shows the NEW email
6. **VERIFY:** Profile data changed to the new account

### Test 3: Different Device/Browser
1. Use a completely different browser or device
2. Go to the app
3. Click "Sign In"
4. Select any account
5. **EXPECTED:** Shows that account's data (not tarunkanthmovva007)

## If Google Doesn't Show Account Picker

This means Google has "Remember this device" enabled. To fix:

**Option A: Sign out from Google completely**
1. Go to https://accounts.google.com
2. Click your profile → Sign out
3. Try logging into CuraLink again

**Option B: Use this direct link**
https://accounts.google.com/AddSession

This forces Google to show account picker.

## Check Backend Logs

While testing, monitor logs in real-time:
```bash
tail -f /var/log/supervisor/backend.err.log | grep "AUTH:"
```

You should see:
```
AUTH: Session ID received: [session_id]
AUTH: Processing login for email: [THE EMAIL YOU SELECTED]
AUTH: Session token from Emergent: [token]
AUTH: Creating session - User: [THE EMAIL YOU SELECTED]
AUTH: Session verification - Token maps to user: [THE EMAIL YOU SELECTED]
```

## What to Look For

✅ **WORKING:** Email in logs matches email you selected in Google
✅ **WORKING:** Dashboard shows correct email and profile data
✅ **WORKING:** Can switch between accounts successfully

❌ **BUG:** Email in logs doesn't match what you selected
❌ **BUG:** Dashboard shows wrong account
❌ **BUG:** Can't switch accounts

## Current Fixes Applied

1. ✅ `prompt=select_account` in OAuth URL
2. ✅ Duplicate token detection in backend
3. ✅ Unique index on session_token
4. ✅ Enhanced logging
5. ✅ Session verification after creation

## If Issue Persists After Testing

Share:
1. Which email you selected in Google
2. Which email shows in the dashboard
3. Backend logs during login (grep AUTH:)
4. Screenshot of Google account picker

This will help identify if:
- Google is returning wrong account (OAuth provider issue)
- Emergent is transforming the data (middleware issue)
- Backend is mapping incorrectly (our code issue)
