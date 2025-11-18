# How to Clear Stale Authentication Cookies

If you're seeing the wrong user account, follow these steps:

## Method 1: Use Browser DevTools (RECOMMENDED)
1. Open the app: https://medisync-34.preview.emergentagent.com
2. Press F12 to open Developer Tools
3. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
4. On the left, expand "Cookies"
5. Click on "https://medisync-34.preview.emergentagent.com"
6. Find cookie named "session_token"
7. Right-click → Delete
8. Refresh the page (F5)

## Method 2: Clear All Site Data
1. Press F12
2. Go to "Application" tab
3. On the left, find "Clear storage" or "Storage"
4. Click "Clear site data" button
5. Refresh the page

## Method 3: Incognito/Private Window
1. Open a new incognito/private window (Ctrl+Shift+N or Cmd+Shift+N)
2. Go to https://medisync-34.preview.emergentagent.com
3. This will have no cookies - fresh start

## Method 4: Browser Settings
Chrome:
- Settings → Privacy and security → Cookies and other site data → See all site data
- Search for "emergentagent.com"
- Click "Remove all shown"

Firefox:
- Settings → Privacy & Security → Cookies and Site Data → Manage Data
- Search for "emergentagent.com"
- Remove all

## After Clearing:
1. Refresh the page
2. You should see the login page
3. Click "Sign In"
4. Select the Google account you want to use
5. Verify you see the CORRECT email in the app

## If Issue Persists:
Contact support with this information:
1. What email you selected in Google OAuth
2. What email shows in the app
3. Output from: https://medisync-34.preview.emergentagent.com/api/auth/debug
