import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { statements, ready } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000; // cPanel Passenger injects PORT

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for React app
}));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Serve static files from the dist directory (your built React app)
app.use(express.static(path.join(__dirname, '../dist')));

// Helper function to generate unique student name
function getUniqueStudentName(desiredName) {
    const existingSubmissions = statements.getSubmissionsByStudent(desiredName);

    if (existingSubmissions.length === 0) {
        return desiredName;
    }

    // Find all names matching pattern: desiredName, desiredName_1, desiredName_2, etc.
    const namePattern = new RegExp(`^${desiredName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(_\\d+)?$`);
    const allSubmissions = statements.getAllSubmissions();
    const matchingNames = allSubmissions
        .map(sub => sub.student_name)
        .filter(name => namePattern.test(name));

    const suffixNumbers = matchingNames.map(name => {
        const match = name.match(/_(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
    });

    const nextSuffix = Math.max(...suffixNumbers) + 1;
    return `${desiredName}_${nextSuffix}`;
}

// ============================================
// API ENDPOINTS
// ============================================

// 1. Get all submissions (for admin page)
app.get('/api/submissions', (req, res) => {
    try {
        const submissions = statements.getAllSubmissions();
        const formatted = submissions.map(sub => ({
            studentName: sub.student_name,
            answers: JSON.parse(sub.answers),
            score: sub.score,
            totalMarks: sub.total_marks,
            timestamp: sub.timestamp,
            attempted: sub.attempted,
            correct: sub.correct,
            wrong: sub.wrong,
            pass: Boolean(sub.pass)
        }));
        res.json(formatted);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// 2. Save answer/submission
app.post('/api/save-answer', (req, res) => {
    try {
        const { studentName, answers, score, totalMarks, timestamp, attempted, correct, wrong, pass } = req.body;

        if (!studentName) {
            return res.status(400).json({ error: 'studentName required' });
        }

        // Generate unique student name
        const uniqueName = getUniqueStudentName(studentName);

        // Insert submission
        statements.insertSubmission(
            uniqueName,
            JSON.stringify(answers),
            score,
            totalMarks,
            timestamp,
            attempted,
            correct,
            wrong,
            pass ? 1 : 0
        );

        console.log(`✅ Saved submission: "${studentName}" as "${uniqueName}"`);
        res.json({
            success: true,
            savedName: uniqueName,
            wasRenamed: studentName !== uniqueName
        });
    } catch (error) {
        console.error('Error saving answer:', error);
        res.status(500).json({ error: 'Failed to save answer' });
    }
});

// 3. Delete answer/submission
app.post('/api/delete-answer', (req, res) => {
    try {
        const { studentName, timestamp } = req.body;

        if (!studentName || !timestamp) {
            return res.status(400).json({ error: 'studentName and timestamp required' });
        }

        const result = statements.deleteSubmission(studentName, timestamp);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        console.log(`✅ Deleted submission: ${studentName} at ${timestamp}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting answer:', error);
        res.status(500).json({ error: 'Failed to delete answer' });
    }
});

// 4. Get all pending students
app.get('/api/pending-students', (req, res) => {
    try {
        const students = statements.getAllPendingStudents();
        const formatted = students.map(s => ({
            studentName: s.student_name,
            timestamp: s.timestamp,
            status: s.status
        }));
        res.json(formatted);
    } catch (error) {
        console.error('Error fetching pending students:', error);
        res.status(500).json({ error: 'Failed to fetch pending students' });
    }
});

// 5. Save pending student
app.post('/api/save-pending-student', (req, res) => {
    try {
        const { studentName, timestamp, status } = req.body;

        if (!studentName) {
            return res.status(400).json({ error: 'studentName required' });
        }

        statements.insertPendingStudent(
            studentName,
            timestamp || new Date().toISOString(),
            status || 'Pending'
        );

        console.log(`✅ Added pending student: ${studentName}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving pending student:', error);
        res.status(500).json({ error: 'Failed to save pending student' });
    }
});

// 6. Remove pending student
app.post('/api/remove-pending-student', (req, res) => {
    try {
        const { studentName } = req.body;

        if (!studentName) {
            return res.status(400).json({ error: 'studentName required' });
        }

        const result = statements.deletePendingStudent(studentName);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Pending student not found' });
        }

        console.log(`✅ Removed pending student: ${studentName}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error removing pending student:', error);
        res.status(500).json({ error: 'Failed to remove pending student' });
    }
});

// 7. Get exam configuration
app.get('/api/exam-config', (req, res) => {
    try {
        const config = statements.getExamConfig();

        if (!config) {
            // Return default config if none exists
            return res.json({
                currentType: 'type1',
                type1: { name: 'Type 1 Questions', questionFile: 'questions.json' },
                type2: { name: 'Type 2 Questions', questionFile: 'questions-type2.json' }
            });
        }

        res.json({
            currentType: config.current_type,
            type1: JSON.parse(config.type1),
            type2: JSON.parse(config.type2)
        });
    } catch (error) {
        console.error('Error fetching exam config:', error);
        res.status(500).json({ error: 'Failed to fetch exam config' });
    }
});

// 8. Update exam configuration
app.post('/api/update-exam-config', (req, res) => {
    try {
        const { currentType, type1, type2 } = req.body;

        if (!currentType || !['type1', 'type2'].includes(currentType)) {
            return res.status(400).json({ error: 'Invalid exam type. Must be type1 or type2' });
        }

        // Get existing config or use defaults
        const existingConfig = statements.getExamConfig();

        const finalType1 = type1 || (existingConfig ? JSON.parse(existingConfig.type1) : { name: 'Type 1 Questions', questionFile: 'questions.json' });
        const finalType2 = type2 || (existingConfig ? JSON.parse(existingConfig.type2) : { name: 'Type 2 Questions', questionFile: 'questions-type2.json' });

        if (existingConfig && !type1 && !type2) {
            // Just update current type
            statements.updateCurrentType(currentType);
        } else {
            // Update everything
            statements.upsertExamConfig(
                currentType,
                JSON.stringify(finalType1),
                JSON.stringify(finalType2)
            );
        }

        console.log(`✅ Updated exam config to: ${currentType}`);
        res.json({
            success: true,
            message: `Exam type updated to ${currentType}`,
            config: {
                currentType,
                type1: finalType1,
                type2: finalType2
            }
        });
    } catch (error) {
        console.error('Error updating exam config:', error);
        res.status(500).json({ error: 'Failed to update exam config' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes (SPA fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
    // Wait for database to be ready
    await ready;

    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════╗
║  🚀 MCQ Exam Server is running!                  ║
║                                                   ║
║  📍 URL: http://localhost:${PORT}                   ║
║  🗄️  Database: SQLite (exam-data.db)             ║
║  ⚡ Status: READY                                 ║
╚═══════════════════════════════════════════════════╝
    `);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
