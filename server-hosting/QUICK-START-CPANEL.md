# Quick Start for cPanel Deployment

## The 3-Step Update Workflow

Every time you update code:

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Pull in cPanel**
   - cPanel → Git™ Version Control
   - Click your repo → Pull/Update

3. **Restart Node App**
   - cPanel → Setup Node.js App
   - Click Restart

**Done. No delete. No reupload.**

---

## First Time Setup

### 1. Clone Repo
cPanel → Git™ Version Control → Create
- Clone URL: `https://github.com/YOUR-USERNAME/100MCQ.git`
- Repository Path: `mcq-app`

### 2. Setup Node App
cPanel → Setup Node.js App → Create Application
- Application root: `mcq-app`
- Startup file: `server.js`
- Node version: 18.x+

### 3. Install Dependencies
cPanel Terminal:
```bash
cd ~/mcq-app
npm install
npm run migrate  # Import existing data
```

### 4. Restart & Done
cPanel → Setup Node.js App → Restart

Your site is live! 🚀

---

## Common Issues

**Changes don't appear?**
→ Restart the app (cPanel → Setup Node.js App → Restart)

**500 Error?**
→ Check logs in Setup Node.js App
→ Verify `server.js` uses `process.env.PORT`

**Files in wrong place?**
→ Application root must match Git repository path

---

For detailed instructions, see [DEPLOYMENT-GUIDE.md](file:///c:/Users/mdmar/Documents/GitHub/100MCQ/server-hosting/DEPLOYMENT-GUIDE.md)
