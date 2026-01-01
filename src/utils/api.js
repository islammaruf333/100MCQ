export async function saveSubmission(payload) {
  let res;
  try {
    res = await fetch('/api/save-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch (fetchErr) {
    throw fetchErr;
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Failed to save submission')
  }

  const result = await res.json()
  return result
}

export async function deleteSubmission(studentName, timestamp) {
  let res;
  try {
    res = await fetch('/api/delete-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName, timestamp })
    })
  } catch (fetchErr) {
    throw fetchErr;
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Failed to delete submission')
  }

  return res.json()
}

export async function deleteStudent(studentName) {
  let res;
  try {
    res = await fetch('/api/delete-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName })
    })
  } catch (fetchErr) {
    throw fetchErr;
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Failed to delete student')
  }

  return res.json()
}

// ✅ FIXED: Now uses /api/submissions instead of GitHub raw URL
export async function loadSubmissions() {
  let res;
  try {
    res = await fetch('/api/submissions', {
      cache: 'no-store'
    })
  } catch (fetchErr) {
    console.error('Failed to fetch submissions:', fetchErr)
    throw new Error('Network error: Could not connect to backend API')
  }

  if (!res.ok) {
    const text = await res.text().catch(() => 'Could not read error')
    throw new Error(`Failed to load submissions: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return data
}

export async function loadLatestQuestions() {
  try {
    // Use server-side API to get latest questions file (much faster than looping)
    const res = await fetch('/api/get-latest-questions', {
      cache: 'no-store'
    })

    if (res.ok) {
      const data = await res.json()
      console.log(`Using latest questions file: ${data.file} (version ${data.version})`)
      return data
    }

    // If API fails, fall back to default
    console.warn('API endpoint failed, using default questions.json')
    return { file: 'questions.json', version: 0 }
  } catch (error) {
    // If there's any error (network, parsing, etc.), use default
    console.error('Error getting latest questions:', error)
    console.log('Falling back to default questions.json')
    return { file: 'questions.json', version: 0 }
  }
}

export async function savePendingStudent(studentName, timestamp = null) {
  let res;
  try {
    res = await fetch('/api/save-pending-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName,
        timestamp: timestamp ? new Date(timestamp).toISOString() : undefined
      })
    })
  } catch (fetchErr) {
    throw fetchErr;
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Failed to save pending student')
  }

  return res.json()
}

export async function removePendingStudent(studentName) {
  let res;
  try {
    res = await fetch('/api/remove-pending-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName })
    })
  } catch (fetchErr) {
    throw fetchErr;
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Failed to remove pending student')
  }

  return res.json()
}

// ✅ FIXED: Now uses /api/pending-students instead of GitHub raw URL
export async function loadPendingStudents() {
  let res;
  try {
    res = await fetch('/api/pending-students', {
      cache: 'no-store'
    })
  } catch (fetchErr) {
    console.error('Failed to fetch pending students:', fetchErr)
    throw new Error('Network error: Could not connect to backend API')
  }

  if (!res.ok) {
    // If file doesn't exist yet, return empty array
    if (res.status === 404) {
      return []
    }
    const text = await res.text().catch(() => 'Could not read error')
    throw new Error(`Failed to load pending students: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return data
}

// ✅ CRITICAL FIX: Now uses /api/exam-config instead of GitHub raw URL
// This fixes the question type selection bug where changes weren't persisting
export async function loadExamConfig() {
  let res
  try {
    console.log('📡 Fetching exam config from /api/exam-config')
    res = await fetch('/api/exam-config', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  } catch (fetchErr) {
    console.error('❌ Network error fetching exam config:', fetchErr)
    throw new Error('Network error: Could not connect to backend API')
  }

  if (!res.ok) {
    console.error(`❌ API returned error: ${res.status} ${res.statusText}`)
    throw new Error(`Failed to load exam configuration: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  console.log('✅ Exam config loaded successfully:', data)
  return data
}

export async function updateExamConfig(config) {
  let res
  try {
    console.log('📤 Updating exam config:', config)
    res = await fetch('/api/update-exam-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
  } catch (fetchErr) {
    console.error('❌ Network error updating exam config:', fetchErr)
    throw new Error('Network error: Could not connect to backend API')
  }

  if (!res.ok) {
    const text = await res.text()
    console.error('❌ Failed to update exam config:', text)
    throw new Error(text || 'Failed to update exam configuration')
  }

  const result = await res.json()
  console.log('✅ Exam config updated successfully:', result)
  return result
}


export async function loadQuestionFiles() {
  let res
  try {
    res = await fetch('/api/question-files', {
      cache: 'no-store'
    })
  } catch (fetchErr) {
    console.error('Failed to fetch question files:', fetchErr)
    throw new Error('Network error: Could not connect to backend API')
  }

  if (!res.ok) {
    throw new Error(`Failed to load question files: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return data
}

export async function uploadQuestionFile(filename, content) {
  let res
  try {
    res = await fetch('/api/upload-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content })
    })
  } catch (fetchErr) {
    console.error('Failed to upload question file:', fetchErr)
    throw new Error('Network error: Could not connect to backend API')
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Failed to upload file')
  }

  return res.json()
}
