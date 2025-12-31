# URGENT: Fix MongoDB Authentication Error

## Problem Identified
Error: `bad auth : authentication failed`

**Root Cause:** MongoDB credentials in Vercel are incorrect or improperly formatted.

---

## IMMEDIATE FIX (Do These 3 Steps NOW)

### Step 1: Fix MongoDB Connection String Format

Your connection string is missing the database name. Update it to:

```
mongodb+srv://rifah23tasnia_db_user:4Vw7mgFF8nzzQP8A@100mcq.5yw0qvw.mongodb.net/mcq_exam_system?retryWrites=true&w=majority&appName=100MCQ
```

**What changed:**
- Added `/mcq_exam_system` after `.mongodb.net` (your database name)
- Moved `?appName=100MCQ` to the end of the query string

### Step 2: Update Vercel Environment Variable

1. Go to: https://vercel.com/dashboard
2. Click your project `100MCQ`
3. Go to: **Settings** → **Environment Variables**
4. Find `MONGODB_URI`
5. Click **Edit**
6. Replace with the corrected connection string above
7. Make sure it's enabled for **Production**, **Preview**, and **Development**
8. Click **Save**

### Step 3: Redeploy

**CRITICAL:** Environment variable changes require redeployment!

1. Go to: **Deployments** tab
2. Click the three dots `...` on the latest deployment
3. Click **Redeploy**
4. **OR** push any change to trigger redeploy:

```bash
# Quick way to trigger redeploy
git commit --allow-empty -m "Redeploy after fixing MongoDB credentials"
git push origin main
```

---

## Test After Redeployment

Wait 1-2 minutes for deployment to complete, then test:

```bash
# Test debug endpoint
curl https://100-mcq-nine.vercel.app/api/debug-env

# Test exam config (previously failing)
curl https://100-mcq-nine.vercel.app/api/exam-config
```

**Expected:** Both should return 200 OK

---

## SECURITY ISSUE - Credentials Leaked!

⚠️ **GitHub detected your MongoDB credentials in public commits:**
- Username: `rifah23tasnia_db_user`
- Password: `4Vw7mgFF8nzzQP8A`

### Secure Your Database NOW

#### Option A: Change MongoDB Password (Recommended)

1. Log into MongoDB Atlas: https://cloud.mongodb.com/
2. Go to: **Database Access**
3. Find user `rifah23tasnia_db_user`
4. Click **Edit** → **Edit Password**
5. Click **Autogenerate Secure Password** → **Copy**
6. Click **Update User**
7. Update Vercel environment variable with new password:
   ```
   mongodb+srv://rifah23tasnia_db_user:NEW_PASSWORD_HERE@100mcq.5yw0qvw.mongodb.net/mcq_exam_system?retryWrites=true&w=majority&appName=100MCQ
   ```
8. Redeploy Vercel

#### Option B: Create New Database User

1. MongoDB Atlas → **Database Access**
2. Click **Add New Database User**
3. Create username/password (use autogenerate for password)
4. Give **Read and write to any database** permission
5. Click **Add User**
6. Update Vercel with new credentials
7. Delete old user `rifah23tasnia_db_user`

### Remove Leaked Credentials from Git History

```bash
# Remove from current files
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch VERCEL_DEBUGGING_GUIDE.md scripts/migrate-to-mongodb.js" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remove from history
git push origin --force --all
```

**OR** Easier approach - just change the password in MongoDB Atlas (Option A above).

---

## Why This Happened

1. **Missing Database Name:** Connection string needs `/database_name` after cluster URL
2. **Incorrect Format:** Query parameters must come after database name
3. **Leaked in Files:** Never commit credentials to Git

---

## Verify It's Fixed

After redeploying with corrected connection string:

### 1. Check Vercel Function Logs
- Should see: `✓ [MongoDB] Connected in XXms`
- Should NOT see: `bad auth` or `authentication failed`

### 2. Test Endpoints
```bash
# This should work now
curl https://100-mcq-nine.vercel.app/api/exam-config
```

### 3. Check Application
- Open: https://100-mcq-nine.vercel.app
- Error message should disappear
- Exam configuration should load

---

## Summary Checklist

- [ ] Updated connection string with database name `/mcq_exam_system`
- [ ] Updated Vercel environment variable `MONGODB_URI`
- [ ] Redeployed Vercel (or pushed empty commit)
- [ ] Tested `/api/exam-config` endpoint
- [ ] Changed MongoDB password (security)
- [ ] Removed credentials from Git files

After completing these steps, your 500 error will be RESOLVED.
