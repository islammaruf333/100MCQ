import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { statements, ready } from './database.js'; // Import ready promise

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateDataFromJSON() {
    console.log('⏳ Waiting for database initialization...');
    await ready; // Wait for DB to be ready
    console.log('✅ Database ready. Starting migration from JSON files to SQLite...\n');

    try {
        // 1. Migrate answers.json to submissions table
        console.log('📁 Migrating answers.json...');
        try {
            const answersPath = path.join(__dirname, '../answers.json');
            const answersData = await fs.readFile(answersPath, 'utf-8');
            const answers = JSON.parse(answersData);

            if (Array.isArray(answers) && answers.length > 0) {
                let count = 0;
                for (const answer of answers) {
                    try {
                        const exists = statements.getSubmissionByNameAndTime(answer.studentName, answer.timestamp);
                        if (!exists) {
                            statements.insertSubmission(
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
                            count++;
                        } else {
                            // console.log(`   ⏭️  Skipping existing: ${answer.studentName}`);
                        }
                    } catch (err) {
                        console.log(`   ⚠️  Error inserting: ${answer.studentName} - ${err.message}`);
                    }
                }
                console.log(`   ✅ Migrated ${count} new submissions (from total ${answers.length})\n`);
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
                let count = 0;
                for (const student of pending) {
                    try {
                        const exists = statements.getPendingStudent(student.studentName);
                        if (!exists) {
                            statements.insertPendingStudent(
                                student.studentName,
                                student.timestamp || new Date().toISOString(),
                                student.status || 'Pending'
                            );
                            count++;
                        }
                    } catch (err) {
                        console.log(`   ⚠️  Error inserting pending: ${student.studentName}`);
                    }
                }
                console.log(`   ✅ Migrated ${count} new pending students (from total ${pending.length})\n`);
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

            statements.upsertExamConfig(
                config.currentType || 'type1',
                JSON.stringify(config.type1 || { name: 'Type 1 Questions', questionFile: 'questions.json' }),
                JSON.stringify(config.type2 || { name: 'Type 2 Questions', questionFile: 'questions-type2.json' })
            );
            console.log(`   ✅ Migrated exam configuration\n`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('   ℹ️  exam-config.json not found, using defaults...\n');
                statements.upsertExamConfig(
                    'type1',
                    JSON.stringify({ name: 'Type 1 Questions', questionFile: 'questions.json' }),
                    JSON.stringify({ name: 'Type 2 Questions', questionFile: 'questions-type2.json' })
                );
            } else {
                throw error;
            }
        }

        console.log('✅ Migration completed successfully!\n');

        // Wait for database to save
        setTimeout(() => {
            const allSubs = statements.getAllSubmissions();
            const allPending = statements.getAllPendingStudents();
            const config = statements.getExamConfig();

            console.log('📊 Final Statistics:');
            console.log(`   - Total Submissions in DB: ${allSubs.length}`);
            console.log(`   - Pending Students in DB: ${allPending.length}`);
            console.log(`   - Exam Config: ${config ? 'Configured' : 'Missing'}`);
            process.exit(0);
        }, 1000);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateDataFromJSON();
