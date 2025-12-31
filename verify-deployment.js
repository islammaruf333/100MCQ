// No imports needed for Node 18+

const endpoints = [
    'https://100-mcq-nine.vercel.app/api/exam-config',
    'https://100-mcq-nine.vercel.app/api/health',
    'https://100-mcq-nine.vercel.app/api/submissions'
];

async function check() {
    console.log('Checking endpoints...');
    for (const url of endpoints) {
        try {
            const res = await fetch(url);
            console.log(`\nURL: ${url}`);
            console.log(`Status: ${res.status} ${res.statusText}`);

            if (!res.ok) {
                const text = await res.text();
                // print first 500 chars of error
                console.log(`Error Body: ${text.substring(0, 500)}`);
            } else {
                const json = await res.json();
                console.log('Success! JSON response length:', JSON.stringify(json).length);
            }
        } catch (err) {
            console.error(`Failed to fetch ${url}:`, err.message);
        }
    }
}

check();
