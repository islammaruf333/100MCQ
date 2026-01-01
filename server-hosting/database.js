import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'exam-data.db');

let SQL;
let db;

// Initialize SQL.js
async function initDatabase() {
  SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('✅ Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('✅ Created new database');
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      answers TEXT NOT NULL,
      score REAL NOT NULL,
      total_marks REAL NOT NULL,
      timestamp TEXT NOT NULL,
      attempted INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      wrong INTEGER NOT NULL,
      pass INTEGER NOT NULL,
      question_file TEXT DEFAULT 'questions.json',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Add question_file column if it doesn't exist
  try {
    db.run(`ALTER TABLE submissions ADD COLUMN question_file TEXT DEFAULT 'questions.json'`);
    console.log('✅ Added question_file column to submissions table');
  } catch (e) {
    // Column already exists, ignore error
    if (!e.message.includes('duplicate column name')) {
      console.error('Migration warning:', e.message);
    }
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS pending_students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL UNIQUE,
      timestamp TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS exam_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_type TEXT NOT NULL,
      type1 TEXT NOT NULL,
      type2 TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_name)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_submissions_timestamp ON submissions(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_pending_students_name ON pending_students(student_name)`);

  // Save to disk
  saveDatabase();
  console.log('✅ Database tables created successfully');
}

// Save database to disk
function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Database operations
export const statements = {
  // Submissions
  getAllSubmissions: () => {
    const result = db.exec('SELECT * FROM submissions ORDER BY created_at DESC');
    if (result.length === 0) return [];
    return result[0].values.map(row => ({
      id: row[0],
      student_name: row[1],
      answers: row[2],
      score: row[3],
      total_marks: row[4],
      timestamp: row[5],
      attempted: row[6],
      correct: row[7],
      wrong: row[8],
      pass: row[9],
      question_file: row[10],  // Map to questionFile for frontend
      created_at: row[11]
    }));
  },

  getSubmissionByNameAndTime: (studentName, timestamp) => {
    const result = db.exec(
      'SELECT * FROM submissions WHERE student_name = ? AND timestamp = ?',
      [studentName, timestamp]
    );
    if (result.length === 0) return null;
    const row = result[0].values[0];
    return {
      id: row[0],
      student_name: row[1],
      answers: row[2],
      score: row[3],
      total_marks: row[4],
      timestamp: row[5],
      attempted: row[6],
      correct: row[7],
      wrong: row[8],
      pass: row[9],
      question_file: row[10],
      created_at: row[11]
    };
  },

  insertSubmission: (studentName, answers, score, totalMarks, timestamp, attempted, correct, wrong, pass, questionFile = 'questions.json') => {
    db.run(
      'INSERT INTO submissions (student_name, answers, score, total_marks, timestamp, attempted, correct, wrong, pass, question_file) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?, ?)',
      [studentName, answers, score, totalMarks, timestamp, attempted, correct, wrong, pass, questionFile]
    );
    saveDatabase();
    return { changes: db.getRowsModified() };
  },

  deleteSubmission: (studentName, timestamp) => {
    db.run('DELETE FROM submissions WHERE student_name = ? AND timestamp = ?', [studentName, timestamp]);
    const changes = db.getRowsModified();
    saveDatabase();
    return { changes };
  },

  getSubmissionsByStudent: (studentName) => {
    const result = db.exec('SELECT * FROM submissions WHERE student_name = ?', [studentName]);
    if (result.length === 0) return [];
    return result[0].values.map(row => ({
      id: row[0],
      student_name: row[1],
      answers: row[2],
      score: row[3],
      total_marks: row[4],
      timestamp: row[5],
      attempted: row[6],
      correct: row[7],
      wrong: row[8],
      pass: row[9],
      question_file: row[10],
      created_at: row[11]
    }));
  },

  // Pending students
  getAllPendingStudents: () => {
    const result = db.exec('SELECT * FROM pending_students ORDER BY created_at DESC');
    if (result.length === 0) return [];
    return result[0].values.map(row => ({
      id: row[0],
      student_name: row[1],
      timestamp: row[2],
      status: row[3],
      created_at: row[4]
    }));
  },

  getPendingStudent: (studentName) => {
    const result = db.exec('SELECT * FROM pending_students WHERE student_name = ?', [studentName]);
    if (result.length === 0) return null;
    const row = result[0].values[0];
    return {
      id: row[0],
      student_name: row[1],
      timestamp: row[2],
      status: row[3],
      created_at: row[4]
    };
  },

  insertPendingStudent: (studentName, timestamp, status) => {
    try {
      db.run(
        'INSERT OR IGNORE INTO pending_students (student_name, timestamp, status) VALUES (?, ?, ?)',
        [studentName, timestamp, status]
      );
      const changes = db.getRowsModified();
      saveDatabase();
      return { changes };
    } catch (error) {
      return { changes: 0 };
    }
  },

  deletePendingStudent: (studentName) => {
    db.run('DELETE FROM pending_students WHERE student_name = ?', [studentName]);
    const changes = db.getRowsModified();
    saveDatabase();
    return { changes };
  },

  // Exam config
  getExamConfig: () => {
    const result = db.exec('SELECT * FROM exam_config WHERE id = 1');
    if (result.length === 0) return null;
    const row = result[0].values[0];
    return {
      id: row[0],
      current_type: row[1],
      type1: row[2],
      type2: row[3],
      updated_at: row[4]
    };
  },

  upsertExamConfig: (currentType, type1, type2) => {
    db.run(`
      INSERT OR REPLACE INTO exam_config (id, current_type, type1, type2, updated_at)
      VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [currentType, type1, type2]);
    saveDatabase();
  },

  updateCurrentType: (currentType) => {
    db.run(
      'UPDATE exam_config SET current_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
      [currentType]
    );
    saveDatabase();
  }
};

// Initialize database on import
export const ready = initDatabase();

export default db;
