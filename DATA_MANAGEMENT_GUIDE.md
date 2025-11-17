# CuraLink Data Management Guide

## 🧹 Clearing User Data and Sessions

### Quick Commands

#### 1. Clear All Login Sessions Only
```bash
cd /app/backend
python3 quick_clear_sessions.py
```
**What it does:**
- Logs out all users
- Clears AskCura chat history
- Preserves all user profiles and data
- Users need to log in again

#### 2. Clear Sessions with Interactive Menu
```bash
cd /app/backend
python3 clear_all_data.py
```
**Options available:**
1. Clear only sessions (recommended for testing)
2. Clear ALL user data (complete reset)
3. Exit

---

## 📊 What Gets Cleared

### Option 1: Sessions Only (Recommended for Testing)
✅ Clears:
- User login sessions
- AskCura conversation history

❌ Keeps:
- User accounts
- Patient profiles
- Researcher profiles
- Favorites
- Reviews
- Appointments
- Chat messages
- Collaborations
- All other user data

### Option 2: Complete Data Reset
✅ Clears EVERYTHING:
- User accounts
- Patient profiles
- Researcher profiles
- User sessions
- AskCura conversations
- Treatment comparisons
- Protocol comparisons
- Notifications
- Favorites
- Chat rooms and messages
- Reviews
- Appointments
- Collaborations
- Activity logs

---

## 🔧 Manual Database Clearing (MongoDB Shell)

### Clear Sessions Only
```javascript
// Connect to MongoDB
use test_database

// Clear sessions
db.user_sessions.deleteMany({})

// Verify
db.user_sessions.countDocuments({})
// Should return 0
```

### Clear Specific User's Session
```javascript
// Find user's session
db.user_sessions.find({ "user_id": "USER_ID_HERE" })

// Delete specific user's session
db.user_sessions.deleteMany({ "user_id": "USER_ID_HERE" })
```

### Clear All User Data
```javascript
// WARNING: This deletes everything!
use test_database

db.users.deleteMany({})
db.patient_profiles.deleteMany({})
db.researcher_profiles.deleteMany({})
db.user_sessions.deleteMany({})
db.askcura_conversations.deleteMany({})
db.treatment_comparisons.deleteMany({})
db.protocol_comparisons.deleteMany({})
db.notifications.deleteMany({})
db.favorites.deleteMany({})
db.chat_rooms.deleteMany({})
db.messages.deleteMany({})
db.reviews.deleteMany({})
db.appointments.deleteMany({})
db.collaborations.deleteMany({})
db.activity_logs.deleteMany({})
```

---

## 🎯 Common Use Cases

### Use Case 1: Fresh Testing
**Scenario**: You want to test the application from scratch with new user accounts

**Solution**: Clear sessions only
```bash
cd /app/backend
python3 quick_clear_sessions.py
```

**Result**: 
- All users logged out
- Can create new accounts or log in with existing accounts
- Previous user data preserved

---

### Use Case 2: Complete Reset
**Scenario**: You want to completely reset the application and start over

**Solution**: Use interactive script, option 2
```bash
cd /app/backend
python3 clear_all_data.py
# Choose option 2
# Type "DELETE ALL DATA" to confirm
```

**Result**: 
- All data wiped
- Clean database
- Fresh start

---

### Use Case 3: Clear Specific User
**Scenario**: You want to log out a specific user only

**Solution**: Manual MongoDB command
```javascript
use test_database
db.user_sessions.deleteMany({ "user_id": "specific_user_id" })
```

---

### Use Case 4: Clear Old Sessions
**Scenario**: You want to clear expired or old sessions

**Solution**: MongoDB query with date filter
```javascript
use test_database

// Clear sessions older than 7 days
var sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000);
db.user_sessions.deleteMany({ 
  "created_at": { $lt: sevenDaysAgo.toISOString() }
})
```

---

## 🔍 Verify Data Clearing

### Check Session Count
```bash
# Using Python
cd /app/backend
python3 << EOF
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['test_database']
    count = await db.user_sessions.count_documents({})
    print(f"Active sessions: {count}")
    client.close()

asyncio.run(check())
EOF
```

### Check User Count
```bash
# Using MongoDB shell
mongosh --eval "use test_database; db.users.countDocuments({})"
```

### Check All Collections
```bash
mongosh --eval "
use test_database;
print('Users:', db.users.countDocuments({}));
print('Sessions:', db.user_sessions.countDocuments({}));
print('Patient Profiles:', db.patient_profiles.countDocuments({}));
print('Researcher Profiles:', db.researcher_profiles.countDocuments({}));
"
```

---

## 🚨 Important Notes

### Before Clearing Sessions
- Save any important data or export if needed
- Inform users if in production
- Consider backup if clearing all data

### After Clearing Sessions
- Users will be logged out immediately
- Next API request will return 401 Unauthorized
- Users need to sign in again with Google OAuth

### After Clearing All Data
- Database is completely empty
- No user accounts exist
- All user-generated content is gone
- Cannot be undone

---

## 🔐 Security Considerations

### Session Management
- Sessions expire after 7 days automatically
- Manual clearing is useful for:
  - Security incidents
  - Testing
  - User logout enforcement
  - Database maintenance

### Data Privacy
- Clearing user data is permanent
- Ensure compliance with data retention policies
- Keep audit logs if required
- Inform users before deleting their data

---

## 📋 Backup Before Clearing

### Create MongoDB Backup
```bash
# Backup entire database
mongodump --db test_database --out /path/to/backup

# Backup specific collection
mongodump --db test_database --collection users --out /path/to/backup
```

### Restore from Backup
```bash
# Restore entire database
mongorestore --db test_database /path/to/backup/test_database

# Restore specific collection
mongorestore --db test_database --collection users /path/to/backup/test_database/users.bson
```

---

## 🔄 Automated Session Cleanup

### Setup Cron Job (Optional)
Clear old sessions automatically every day:

```bash
# Edit crontab
crontab -e

# Add this line to clear sessions daily at 3 AM
0 3 * * * cd /app/backend && python3 quick_clear_sessions.py >> /var/log/session_cleanup.log 2>&1
```

### MongoDB TTL Index (Recommended)
Set up automatic session expiration:

```javascript
// Connect to MongoDB
use test_database

// Create TTL index on user_sessions
db.user_sessions.createIndex(
  { "created_at": 1 },
  { expireAfterSeconds: 604800 }  // 7 days
)

// Sessions will automatically delete after 7 days
```

---

## 📞 Support

If you encounter issues:
1. Check MongoDB connection
2. Verify database name in .env
3. Check script permissions
4. Review MongoDB logs
5. Contact support if needed

---

## 📚 Quick Reference

| Action | Command | Data Loss |
|--------|---------|-----------|
| Clear sessions | `python3 quick_clear_sessions.py` | None (users re-login) |
| Interactive menu | `python3 clear_all_data.py` | Depends on choice |
| Complete reset | Option 2 in menu | ALL DATA |
| Check sessions | `mongosh --eval "use test_database; db.user_sessions.countDocuments({})"` | None |

---

**Last Updated**: 2025-11-16  
**Script Location**: `/app/backend/`  
**Scripts**:
- `clear_all_data.py` - Interactive data management
- `quick_clear_sessions.py` - Quick session clear
