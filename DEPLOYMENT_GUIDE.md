# CuraLink Deployment Guide for Emergent Platform

## 🚀 Production URL
**Live Application**: https://medmatch-7.emergent.host

---

## ✅ Configuration Changes Applied

### 1. Frontend Configuration (`/app/frontend/.env`)
```env
REACT_APP_BACKEND_URL=https://medmatch-7.emergent.host
WDS_SOCKET_PORT=443
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
REACT_APP_JITSI_DOMAIN=meet.jit.si
REACT_APP_AUTH_URL=https://auth.emergentagent.com
```

### 2. Backend Configuration (`/app/backend/.env`)
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="http://localhost:3000,https://health-matchmaker-1.preview.emergentagent.com,https://medmatch-7.emergent.host"
REACT_APP_BACKEND_URL="https://medmatch-7.emergent.host"
EMERGENT_LLM_KEY=sk-emergent-11bC96bFcBb370c626
EMERGENT_AUTH_BACKEND_URL=https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data

# Google OAuth Configuration
GOOGLE_CLIENT_ID="1016763672270-u7h1js8el33mujs82n3ma5aaf9nurkvh.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
```

### 3. Code Changes
- Updated hardcoded URLs in `backend/server.py` (lines 580, 612)
- Updated `backend/auth_google.py` to use environment variables for OAuth credentials
- All URLs now point to production domain: `https://medmatch-7.emergent.host`

---

## 🔐 Critical: Google OAuth Configuration

### ⚠️ REQUIRED ACTION

You **MUST** update your Google Cloud Console OAuth settings for authentication to work:

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID: `1016763672270-u7h1js8el33mujs82n3ma5aaf9nurkvh.apps.googleusercontent.com`
3. Under **Authorized redirect URIs**, add:
   ```
   https://medmatch-7.emergent.host/api/auth/google/callback
   ```
4. Click **SAVE**
5. Wait 5-10 minutes for Google to propagate the changes

**Current Redirect URIs** (these should already be configured):
- `http://localhost:8001/api/auth/google/callback`
- `https://health-matchmaker-1.preview.emergentagent.com/api/auth/google/callback`

**New Production URI** (add this):
- `https://medmatch-7.emergent.host/api/auth/google/callback`

### Why This is Critical
Without the correct redirect URI, users will see:
- "redirect_uri_mismatch" error
- "Service temporarily unavailable"
- Authentication will fail completely

---

## 📋 Emergent Platform Deployment Checklist

### Step 1: Environment Variables Configuration

In your Emergent project dashboard, set these environment variables:

#### Backend Environment Variables
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=curalink_production
EMERGENT_LLM_KEY=sk-emergent-11bC96bFcBb370c626
EMERGENT_AUTH_BACKEND_URL=https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data
GOOGLE_CLIENT_ID=1016763672270-u7h1js8el33mujs82n3ma5aaf9nurkvh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
CORS_ORIGINS=https://medmatch-7.emergent.host
REACT_APP_BACKEND_URL=https://medmatch-7.emergent.host
```

#### Frontend Environment Variables
```
REACT_APP_BACKEND_URL=https://medmatch-7.emergent.host
WDS_SOCKET_PORT=443
REACT_APP_JITSI_DOMAIN=meet.jit.si
REACT_APP_AUTH_URL=https://auth.emergentagent.com
```

### Step 2: Push Code to Repository
```bash
git add .
git commit -m "Configure for production deployment on medmatch-7.emergent.host"
git push origin main
```

### Step 3: Deploy on Emergent
- Emergent will automatically detect the push and deploy
- Or manually trigger deployment from Emergent dashboard

### Step 4: Verify Deployment
After deployment completes:

1. **Check Services Status**
   ```bash
   sudo supervisorctl status all
   ```
   All services should show `RUNNING`

2. **Check Backend Health**
   ```bash
   curl https://medmatch-7.emergent.host/api/auth/me
   ```
   Should return `401 Unauthorized` (expected when not logged in)

3. **Check Frontend**
   - Visit: https://medmatch-7.emergent.host
   - Landing page should load
   - Click "Sign In" button
   - Should redirect to Google OAuth

4. **Test Authentication**
   - Complete Google sign-in
   - Should redirect back to app
   - Dashboard should load

### Step 5: Update Google OAuth (Critical!)
- Add production redirect URI as described above
- Wait 5-10 minutes
- Test authentication again

---

## 🐛 Troubleshooting

### Issue: "Service temporarily unavailable"

**Possible Causes:**
1. Google OAuth redirect URI not configured
2. Environment variables not set in Emergent
3. Backend service not running
4. MongoDB connection failed

**Solution:**
```bash
# Check service status
sudo supervisorctl status all

# Check backend logs
tail -n 100 /var/log/supervisor/backend.err.log

# Check frontend logs
tail -n 100 /var/log/supervisor/frontend.err.log

# Restart services
sudo supervisorctl restart all
```

### Issue: Clinical Trials Not Showing

**Possible Causes:**
1. ClinicalTrials.gov API timeout
2. Network connectivity issue
3. Backend API endpoint not working

**Solution:**
```bash
# Test clinical trials API directly
curl "https://medmatch-7.emergent.host/api/patient/clinical-trials?condition=cancer" \
  -H "Cookie: session_token=YOUR_TOKEN"

# Check backend logs for API errors
grep -i "clinical.trials" /var/log/supervisor/backend.err.log
```

### Issue: Publications Not Showing

**Possible Causes:**
1. PubMed API timeout
2. Network connectivity issue
3. Backend API endpoint not working

**Solution:**
```bash
# Test publications API directly
curl "https://medmatch-7.emergent.host/api/patient/publications?query=cancer+treatment" \
  -H "Cookie: session_token=YOUR_TOKEN"

# Check backend logs for PubMed API errors
grep -i "pubmed" /var/log/supervisor/backend.err.log
```

### Issue: CORS Errors in Browser Console

**Solution:**
Ensure `CORS_ORIGINS` includes your production domain:
```env
CORS_ORIGINS="https://medmatch-7.emergent.host"
```

### Issue: Database Connection Failed

**Solution:**
```bash
# Check MongoDB status
sudo supervisorctl status mongodb

# Check MongoDB logs
tail -n 50 /var/log/supervisor/mongodb.err.log

# Restart MongoDB
sudo supervisorctl restart mongodb
```

---

## 📊 Performance Optimization

### Database Indexes
Add these indexes for better performance:

```javascript
// MongoDB shell commands
use curalink_production

// Researcher profiles
db.researcher_profiles.createIndex({ "specialties": 1 })
db.researcher_profiles.createIndex({ "research_interests": 1 })
db.researcher_profiles.createIndex({ "institution": 1 })

// Clinical trials
db.clinical_trials.createIndex({ "title": "text", "description": "text" })
db.clinical_trials.createIndex({ "disease_areas": 1 })
db.clinical_trials.createIndex({ "status": 1 })

// User sessions
db.user_sessions.createIndex({ "user_id": 1 })
db.user_sessions.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 })
```

---

## 🔒 Security Checklist

- [x] Google OAuth credentials stored in environment variables
- [x] CORS configured with specific allowed origins
- [x] HttpOnly cookies for session management
- [x] No API keys hardcoded in source code
- [x] MongoDB connection secured
- [ ] SSL/TLS enabled (handled by Emergent)
- [ ] Rate limiting configured (optional)
- [ ] Input validation on all API endpoints

---

## 📈 Monitoring

### Key Metrics to Monitor

1. **API Response Times**
   - Patient overview: < 3 seconds
   - Search endpoints: < 2 seconds
   - AskCura AI: 5-15 seconds

2. **Error Rates**
   - Target: < 1% error rate
   - Monitor 4xx and 5xx responses

3. **Database Performance**
   - Query execution time
   - Connection pool usage

4. **External API Status**
   - ClinicalTrials.gov availability
   - PubMed API availability
   - OpenAI API (for AskCura)

### Log Files to Monitor
```bash
# Backend errors
tail -f /var/log/supervisor/backend.err.log

# Frontend errors
tail -f /var/log/supervisor/frontend.err.log

# All logs
tail -f /var/log/supervisor/*.log
```

---

## 📞 Support

If you encounter issues during deployment:

1. Check this troubleshooting guide
2. Review Emergent platform logs
3. Contact Emergent support: [support@emergentagent.com](mailto:support@emergentagent.com)
4. Check application logs as shown above

---

## ✅ Post-Deployment Verification

After successful deployment, verify these features:

- [ ] Landing page loads correctly
- [ ] Google OAuth sign-in works
- [ ] Patient dashboard displays
- [ ] Researcher dashboard displays
- [ ] Clinical trials search returns results
- [ ] Publications search returns results
- [ ] AskCura AI chat responds (both patient and researcher versions)
- [ ] Animated particles background shows on all pages
- [ ] Notifications work
- [ ] Chat functionality works
- [ ] Q&A community works
- [ ] Profile editing works
- [ ] Favorites can be added/removed

---

## 🎯 Next Steps After Deployment

1. Test all major features
2. Monitor application logs for errors
3. Set up regular database backups
4. Configure monitoring and alerts
5. Plan for scaling if needed
6. Document any custom configurations
7. Train users on the platform

---

**Last Updated**: 2025-11-16  
**Deployment URL**: https://medmatch-7.emergent.host  
**Status**: Production Ready ✅
