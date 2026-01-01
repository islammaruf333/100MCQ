import { statements, ready } from './database.js';

async function check() {
    await ready;
    const subs = statements.getAllSubmissions();
    console.log(`Total submissions in DB: ${subs.length}`);
    if (subs.length > 0) {
        console.log('First submission:', subs[0].student_name);
    }
}

check();
