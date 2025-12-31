# cPanel Node.js Deployment Guide (aicnex.software)

**IMPORTANT**: This guide is specifically for **cPanel shared hosting with Node.js**, NOT VPS. cPanel uses **Passenger** to manage Node.js apps, not PM2.

---

## The CORRECT Workflow (No More Delete & Reupload!)

### Your Current Problem
You're deleting all files and reuploading every time you update code. This is:
- ❌ Time wasting
- ❌ Error prone
- ❌ Causes downtime

### The Fix (3 Steps Every Time)
1. **Push code to GitHub**
2. **Pull in cPanel** → Git Version Control → Pull/Update
3. **Restart Node App** → Setup Node.js App → Restart

**That's it. No delete. No upload. Ever again.**

---

## ONE-TIME SETUP (Do This Once)

### Step 1: Clone Your Repo in cPanel

1. Login to cPanel at aicnex.software
2. Go to **Git™ Version Control**
3. Click **Create** button
4. Enable **"Clone a Repository"** toggle

Fill in:
```
Clone URL: https://github.com/YOUR-USERNAME/100MCQ.git
Repository Path: mcq-app
Repository Name: MCQ Exam System
```

Click **Create**

> **CRITICAL**: The Repository Path will become your Application Root. Remember it!

---

### Step 2: Setup Node.js App

1. Go to **Setup Node.js App** in cPanel
2. Click **Create Application**

Fill in:
```
Node.js version: 18.x or higher (latest available)
Application mode: Production
Application root: mcq-app
Application URL: aicnex.software (or your domain)
Application startup file: server.js
```

3. Click **Create**

---

### Step 3: Install Dependencies

After creating the app, cPanel shows a command like:
```bash
source /home/aicnexso/nodevenv/mcq-app/18/bin/activate && cd /home/aicnexso/mcq-app
```

Copy and run it in **Terminal** (cPanel → Terminal), then:
```bash
npm install
```

---

### Step 4: Build Frontend (On Your Local Computer)

On your Windows machine:
```bash
cd c:\Users\mdmar\Documents\GitHub\100MCQ
npm run build
```

This creates the `dist` folder.

---

### Step 5: Upload dist Folder (One Time Only)

Use **File Manager** in cPanel:
- Upload the entire `dist` folder to `/home/aicnexso/mcq-app/`

---

### Step 6: Upload Question Files

Upload to `/home/aicnexso/mcq-app/`:
- `questions.json`
- `questions-type2.json`
- `exam-config.json` (if exists)

---

### Step 7: Migrate Data (Optional)

If you have existing data in JSON files:

In cPanel Terminal:
```bash
cd ~/mcq-app
source /home/aicnexso/nodevenv/mcq-app/18/bin/activate
npm run migrate
```

---

### Step 8: Start the App

Go to **Setup Node.js App** → Find your app → Click **Restart**

Your site is now live at **https://aicnex.software**! 🎉

---

## UPDATING CODE (Every Time You Make Changes)

### The ONLY 3 Steps You Need:

#### 1. Push to GitHub (On Your Computer)
```bash
cd c:\Users\mdmar\Documents\GitHub\100MCQ
git add .
git commit -m "Your update message"
git push origin main
```

#### 2. Pull in cPanel
Login to cPanel → **Git™ Version Control** → Find your repo → Click **Pull or Deploy** tab → Click **Update from Remote**

#### 3. Restart Node App
cPanel → **Setup Node.js App** → Find your app → Click **Restart**

**Done!** Your changes are live.

---

## If You Updated Frontend (React Code)

1. Build locally:
   ```bash
   npm run build
   ```

2. Upload new `dist` folder via File Manager (overwrite old one)

3. Restart Node app

---

## Folder Structure on Server

After setup, your `/home/aicnexso/mcq-app/` should look like:
```
mcq-app/
├── server.js              ← Startup file
├── database.js
├── migrate-from-github.js
├── package.json
├── node_modules/
├── dist/                  ← Built React app
│   ├── index.html
│   └── assets/
├── questions.json
├── questions-type2.json
├── exam-config.json
└── exam-data.db          ← SQLite database (auto-created)
```

---

## Common Mistakes (DON'T DO THESE)

❌ **Uploading files to wrong directory** (e.g., public_html)
   → Always upload to Application Root (mcq-app)

❌ **Forgetting to restart after updating**
   → Node doesn't auto-reload. ALWAYS restart.

❌ **Editing files directly in File Manager**
   → Use Git. Always.

❌ **Trying to use PM2**
   → cPanel uses Passenger. PM2 won't work.

❌ **Hardcoding port 3000**
   → Must use `process.env.PORT` (already fixed in server.js)

---

## Troubleshooting

### "My changes don't appear!"

**Solution**: Did you restart the app?
1. cPanel → Setup Node.js App
2. Click **Restart**

### "500 Internal Server Error"

**Check logs**:
1. cPanel → Setup Node.js App
2. Look at error logs section
3. Common issues:
   - Missing dependencies → Run `npm install`
   - Wrong startup file → Must be `server.js`
   - Port hardcoded → Must use `process.env.PORT`

### "Application not found"

**Check Application Root**:
1. Verify Git cloned to correct path
2. Setup Node.js App → Application root must match Git repository path

### "npm install fails"

**Clear and reinstall**:
```bash
cd ~/mcq-app
rm -rf node_modules package-lock.json
npm install
```

---

## Performance Expectations

After deployment to cPanel with SQLite:

| Operation | Speed |
|-----------|-------|
| Save answer | <100ms |
| Delete | <100ms |
| Update config | <100ms |
| Page load | 1-2 seconds |

**100x faster than GitHub API!**

---

## Backup Your Database

Your exam data is in `exam-data.db`. To backup:

1. cPanel → File Manager
2. Navigate to `/home/aicnexso/mcq-app/`
3. Right-click `exam-data.db` → Download
4. Save weekly

---

## SSH Workflow (Optional - Faster Updates)

If SSH is enabled on your hosting:

```bash
ssh aicnexso@aicnex.software
cd ~/mcq-app
git pull origin main
```

Then restart via cPanel Setup Node.js App.

---

## Summary of Your New Workflow

### Old Way (WRONG):
1. Delete all files ❌
2. Re-upload everything ❌
3. Waste time ❌

### New Way (CORRECT):
1. `git push` ✅
2. cPanel → Pull ✅
3. cPanel → Restart ✅

**That's it. Forever.**

---

## Need Help?

1. Check error logs in Setup Node.js App
2. Verify Application Root matches Git path
3. Ensure `server.js` is the startup file
4. Always restart after changes

Your app is now production-ready with instant updates! 🚀
