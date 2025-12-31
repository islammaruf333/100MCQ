import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { statements } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateDataFromJSON() {
    console.log('🔄 Starting migration from JSON files to SQLite...\n');

    try {
        // 1. Migrate answers.json to submissions table
        console.log('📁 Migrating answers.json...');
        try {
            const answersPath = path.join(__dirname, '../answers.json');
            const answersData = await fs.readFile(answersPath, 'utf-8');
            const answers = JSON.parse(answersData);

            if (Array.isArray(answers) && answers.length > 0) {
                for (const answer of answers) {
                    try {
                        statements.insertSubmission.run(
                            answer.studentName,
                            JSON.stringify(answer.answers),
                            answer.score,
                            answer.totalMarks,
                            answer.timestamp,
                            answer.attempted || 0,
                            answer.correct || 0,
                            answer.wrong || 0,
                            answer.pass ? 1 : 0
                        );
                    } catch (err) {
                        console.log(`   ⚠️  Skipping duplicate: ${answer.studentName} at ${answer.timestamp}`);
                    }
                }
                console.log(`   ✅ Migrated ${answers.length} submissions\n`);
            } else {
                console.log('   ℹ️  No submissions to migrate\n');
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('   ℹ️  answers.json not found, skipping...\n');
            } else {
                throw error;
            }
        }

        // 2. Migrate pending-students.json
        console.log('📁 Migrating pending-students.json...');
        try {
            const pendingPath = path.join(__dirname, '../pending-students.json');
            const pendingData = await fs.readFile(pendingPath, 'utf-8');
            const pending = JSON.parse(pendingData);

            if (Array.isArray(pending) && pending.length > 0) {
                for (const student of pending) {
                    try {
                        statements.insertPendingStudent.run(
                            student.studentName,
                            student.timestamp || new Date().toISOString(),
                            student.status || 'Pending'
                        );
                    } catch (err) {
                        console.log(`   ⚠️  Skipping duplicate: ${student.studentName}`);
                    }
                }
                console.log(`   ✅ Migrated ${pending.length} pending students\n`);
            } else {
                console.log('   ℹ️  No pending students to migrate\n');
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('   ℹ️  pending-students.json not found, skipping...\n');
            } else {
                throw error;
            }
        }

        // 3. Migrate exam-config.json
        console.log('📁 Migrating exam-config.json...');
        try {
            const configPath = path.join(__dirname, '../exam-config.json');
            const configData = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(configData);

            statements.upsertExamConfig.run(
                config.currentType || 'type1',
                JSON.stringify(config.type1 || { name: 'Type 1 Questions', questionFile: 'questions.json' }),
                JSON.stringify(config.type2 || { name: 'Type 2 Questions', questionFile: 'questions-type2.json' })
            );
            console.log(`   ✅ Migrated exam configuration\n`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('   ℹ️  exam-config.json not found, using defaults...\n');
                statements.upsertExamConfig.run(
                    'type1',
                    JSON.stringify({ name: 'Type 1 Questions', questionFile: 'questions.json' }),
                    JSON.stringify({ name: 'Type 2 Questions', questionFile: 'questions-type2.json' })
                );
            } else {
                throw error;
            }
        }

        console.log('✅ Migration completed successfully!\n');
        console.log('📊 Final Statistics:');
        console.log(`   - Total Submissions: ${statements.getAllSubmissions.all().length}`);
        console.log(`   - Pending Students: ${statements.getAllPendingStudents.all().length}`);
        console.log(`   - Exam Config: ${statements.getExamConfig.get() ? 'Configured' : 'Default'}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateDataFromJSON();
