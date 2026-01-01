# MCQ Exam System

A full-featured online MCQ examination system with student exam interface and admin dashboard. Supports both Vercel serverless deployment and traditional cPanel hosting.

## ✨ Features

### For Students
- Clean, intuitive exam interface with countdown timer
- Automatic answer saving (LocalStorage backup)
- Support for multiple exam types (80 MCQ / 25 MCQ)
- Real-time score calculation with negative marking
- Instant results with detailed performance analysis

### For Administrators
- Comprehensive admin dashboard
- View all student submissions with scores
- Filter by pass/fail status
- Detailed answer review with correct/wrong indicators
- Subject-wise performance analytics
- Export capabilities

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (for development)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/100MCQ.git
cd 100MCQ

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` for the exam page and `http://localhost:5173/admin` for the admin panel.

## 📦 Deployment Options

### Option 1: Vercel (Recommended for Quick Deploy)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Set environment variables in Vercel dashboard:
     ```
     GITHUB_OWNER=your-github-username
     GITHUB_REPO=your-repo-name
     GITHUB_BRANCH=main
     GITHUB_TOKEN=your_personal_access_token
     ```

3. **Deploy** - Vercel will automatically build and deploy

### Option 2: cPanel / Traditional Hosting

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Prepare server files**
   - Upload `server-hosting/` directory contents to your server
   - Upload `dist/` directory contents
   - Upload question JSON files

3. **Install dependencies on server**
   ```bash
   cd server-hosting
   npm install
   ```

4. **Start the server**
   ```bash
   node server.js
   ```

The server runs on port 3000 by default (configurable via PORT environment variable).

## 📁 Project Structure

```
100MCQ/
├── src/                    # React source code
│   ├── components/        # Reusable UI components
│   ├── pages/            # Main pages (Exam, Admin)
│   └── utils/            # Helper functions & API calls
│
├── server-hosting/        # Node.js backend for cPanel
│   ├── server.js         # Express server (FIXED: question mapping)
│   ├── database.js       # SQLite database layer (FIXED: added question_file column)
│   └── *.js              # Helper scripts
│
├── api/                   # Vercel serverless functions
│   └── *.js              # API endpoints
│
├── public/                # Static assets & question files
│   ├── questions.json    # Type 1 questions (80 MCQ)
│   ├── questions_type2.json  # Type 2 questions (25 MCQ)
│   └── ...               # Additional question sets
│
└── dist/                  # Build output (generated)
```

## 🎯 Configuration

### Exam Settings

Edit `public/exam-config.json` (or use admin panel):

```json
{
  "currentType": "type1",
  "type1": {
    "questionFile": "questions.json",
    "totalQuestions": 80,
    "durationSeconds": 3600,
    "markPerQuestion": 1.25,
    "negativeMarking": 0.25,
    "passMark": 40,
    "label": "Type 1: 80 Questions - 60 Minutes"
  },
  "type2": {
    "questionFile": "questions_type2.json",
    "totalQuestions": 25,
    "durationSeconds": 1200,
    "markPerQuestion": 1.25,
    "negativeMarking": 0.25,
    "passMark": 15,
    "label": "Type 2: 25 Questions - 20 Minutes"
  }
}
```

### Question File Format

```json
[
  {
    "id": 1,
    "question": "What is 2 + 2?",
    "options": {
      "a": "3",
      "b": "4",
      "c": "5",
      "d": "6"
    },
    "correctAnswer": "b",
    "subject": "Mathematics"
  }
]
```

## 🔧 Recent Fixes

### Question Mapping Bug Fix (2026-01-01)
**Problem**: Admin panel displayed wrong question set when students answered different exam types.

**Solution**: 
- Added `question_file` column to database schema
- Updated backend to store which question file was used
- Fixed admin panel to load correct questions

**Files Changed**:
- `server-hosting/database.js` - Added migration & column
- `server-hosting/server.js` - Extract & store questionFile

## 🛡️ Security Notes

- Admin panel has no authentication (add your own if needed)
- Database files (`.db`, `.sqlite`) are gitignored
- Student data files are gitignored
- Never commit `.env` or `.env.local` files

## 📝 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with React + Vite
- Backend: Express.js + SQLite
- Serverless: Vercel Functions
- UI Components: Custom React components

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Made with ❤️ for educators and students**
