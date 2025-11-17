# Git Conflict Resolution & Deployment Guide

## 🔴 Issue: "Changes conflict detected"

This warning appears when:
1. Your local branch has different commits than the remote branch
2. The remote branch was modified (by deployment, another developer, etc.)
3. Git can't automatically merge the changes

---

## ✅ Solution Options

### Option 1: Pull and Merge (Safest - Recommended)

This preserves all changes from both local and remote:

```bash
# Step 1: Fetch latest from remote
git fetch origin

# Step 2: Pull and merge (may require conflict resolution)
git pull origin main --no-rebase

# Step 3: If conflicts occur, resolve them manually
# Git will mark conflict files - edit them to resolve

# Step 4: After resolving conflicts
git add .
git commit -m "Merge remote changes"

# Step 5: Push
git push origin main
```

**Use this if:**
- You want to keep remote changes
- Multiple people work on the project
- You're not sure what's on remote

---

### Option 2: Force Push (⚠️ Use with Caution)

This **overwrites** remote branch with your local version:

```bash
# This will ERASE all remote changes!
git push origin main --force

# Or use the safer force-with-lease
git push origin main --force-with-lease
```

**Use this ONLY if:**
- You're the only developer
- Remote changes are not important
- You want your local version to be the "truth"
- You know what you're doing

**Warning:** This permanently deletes remote changes!

---

### Option 3: Rebase (Advanced)

This rewrites your commits on top of remote changes:

```bash
# Step 1: Fetch latest
git fetch origin

# Step 2: Rebase your changes on top
git rebase origin/main

# Step 3: If conflicts, resolve and continue
git add .
git rebase --continue

# Step 4: Force push (required after rebase)
git push origin main --force-with-lease
```

**Use this if:**
- You want a clean, linear history
- You understand rebasing
- You're comfortable with force pushing

---

## 🎯 For Emergent Deployment

### Quick Fix (When You Know Your Code is Ready)

Since this is your deployment and you want to push your current working code:

```bash
cd /app

# Check what changed
git status

# Add all changes
git add .

# Commit if there are changes
git commit -m "Production deployment: updated URLs, OAuth config, data management scripts"

# Force push to deploy (overwrites remote)
git push origin main --force

# Or use force-with-lease (safer - fails if remote changed unexpectedly)
git push origin main --force-with-lease
```

---

## 📝 Step-by-Step for Your Current Situation

### Step 1: Check Current State
```bash
cd /app
git status
git log --oneline -5
```

### Step 2: Stage All Changes
```bash
git add -A
```

### Step 3: Commit Your Changes
```bash
git commit -m "Configure for medmatch-7.emergent.host deployment

- Updated frontend/backend URLs to production domain
- Fixed Google OAuth credentials (environment variables)
- Created data management scripts
- Updated README and deployment guides
- Cleared database for fresh testing
- All features tested and working"
```

### Step 4: Choose Push Method

**If you want to be safe:**
```bash
# Try normal push first
git push origin main

# If it fails, pull and merge
git pull origin main
git push origin main
```

**If you're confident (recommended for deployment):**
```bash
# Force push with safety check
git push origin main --force-with-lease
```

---

## 🔍 Understanding the Conflict

Your conflict likely happened because:

1. **Emergent auto-commits**: Platform may auto-commit for checkpoints
2. **Multiple sessions**: Changes from different work sessions
3. **Rollback/restore**: Previous restore operation created divergence

Since you've just:
- Updated URLs for production
- Fixed OAuth configuration
- Cleared database
- Created new scripts

Your local version is the correct one to deploy.

---

## ✅ Recommended Action for You

Based on your situation (deploying to production):

```bash
cd /app

# 1. Make sure all changes are committed
git add -A
git commit -m "Production ready: medmatch-7.emergent.host deployment"

# 2. Force push to deploy (this is safe for your use case)
git push origin main --force-with-lease
```

**Why force-with-lease is safe here:**
- You're the only developer
- You know your local code is correct
- You want to deploy these specific changes
- `--force-with-lease` will still fail if remote changed unexpectedly

---

## 🚨 Important Notes

### Before Force Pushing:
1. Make sure all your changes are committed
2. Verify you're on the correct branch (`main`)
3. Check you have the right remote configured
4. Understand that remote changes will be overwritten

### After Pushing:
1. Verify deployment worked
2. Test the application
3. Check all features work

### Emergency Rollback:
If something goes wrong after force push:

```bash
# Find the previous commit
git reflog

# Reset to previous state
git reset --hard <previous-commit-hash>

# Force push again
git push origin main --force
```

---

## 📞 Git Commands Reference

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `git status` | Show changed files | Always first |
| `git log` | Show commit history | Check what's committed |
| `git pull` | Fetch + merge remote | Sync with remote |
| `git push` | Send commits to remote | Normal push |
| `git push --force` | Overwrite remote | When you're certain |
| `git push --force-with-lease` | Safe force push | Recommended force method |
| `git fetch` | Download remote changes | Check remote without merging |
| `git diff` | Show file changes | Review before commit |

---

## 🎯 Quick Decision Tree

```
Do you want to keep remote changes?
├─ YES → Use git pull, resolve conflicts, then push
└─ NO → Use git push --force-with-lease

Are you the only developer?
├─ YES → Force push is safe
└─ NO → Coordinate with team first

Is this a deployment?
├─ YES → Force push is usually fine
└─ NO → Consider merging

Are you confident in your local code?
├─ YES → Force push with --force-with-lease
└─ NO → Pull and review changes first
```

---

## 💡 Pro Tips

1. **Always use `--force-with-lease` instead of `--force`**
   - Safer: fails if remote changed unexpectedly
   - Same result: overwrites when you want it to

2. **Check before you push**
   ```bash
   git status
   git log --oneline -5
   ```

3. **Use meaningful commit messages**
   - Makes rollback easier
   - Documents your changes

4. **Create a backup branch first**
   ```bash
   git branch backup-before-force-push
   git push --force-with-lease
   ```

5. **Verify after deployment**
   - Check application works
   - Test critical features
   - Review logs

---

## 🎉 For Your Current Deployment

**Execute these commands now:**

```bash
cd /app

# Stage everything
git add -A

# Commit
git commit -m "Production deployment configuration for medmatch-7.emergent.host"

# Push (this will deploy)
git push origin main --force-with-lease
```

If you don't have a remote configured yet, first set it up:

```bash
# Check if remote exists
git remote -v

# If no output, add your remote
git remote add origin YOUR_REPOSITORY_URL

# Then push
git push origin main --force-with-lease
```

---

**Last Updated**: 2025-11-17  
**For**: medmatch-7.emergent.host deployment
