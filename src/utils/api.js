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

export async function loadSubmissions() {
  const isDev = window.location.hostname === 'localhost'
  const url = isDev
    ? '/answers.json'
    : 'https://raw.githubusercontent.com/islammaruf333/100MCQ/main/answers.json'

  let res;
  try {
    res = await fetch(url, {
      cache: 'no-store'
    })
  } catch (fetchErr) {
    throw fetchErr;
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
    // Get the latest question file name
    const res = await fetch('/api/get-latest-questions')
    if (!res.ok) {
      // Fallback to questions.json if API fails
      return { file: 'questions.json' }
    }
    const data = await res.json()
    return data
  } catch (error) {
    console.error('Error getting latest questions:', error)
    // Fallback to questions.json
    return { file: 'questions.json' }
  }
}



