// Initialize database and exam config for cPanel deployment
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ready } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Initializing MCQ Exam System for cPanel...\n');

// Wait for database to be ready
await ready;

console.log('✅ Database initialized successfully\n');

// Create exam-config.json if it doesn't exist
const configPath = path.join(__dirname, 'exam-config.json');
if (!fs.existsSync(configPath)) {
    const defaultConfig = {
        "currentType": "type1",
        "type1": {
            "label": "Type 1: ৮০ প্রশ্ন - ৬০ মিনিট",
            "questionFile": "questions.json",
            "totalQuestions": 80,
            "durationSeconds": 3600,
            "markPerQuestion": 1.25,
            "negativeMarking": 0.25,
            "passMark": 40
        },
        "type2": {
            "label": "Type 2: ২৫ প্রশ্ন - ২০ মিনিট",
            "questionFile": "questions_type2.json",
            "totalQuestions": 25,
            "durationSeconds": 1200,
            "markPerQuestion": 1.25,
            "negativeMarking": 0.25,
            "passMark": 15
        }
    };

    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log('✅ Created exam-config.json with default settings\n');
} else {
    console.log('✅ exam-config.json already exists\n');
}

console.log('🎉 Initialization complete!');
console.log('📋 Summary:');
console.log('   - Database: exam-data.db');
console.log('   - Config: exam-config.json');
console.log('   - Status: Ready for use\n');

process.exit(0);
