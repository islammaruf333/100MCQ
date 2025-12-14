import { useState, useEffect } from 'react'
import './ResultSummary.css'

function ResultSummary({ questions, answers, studentName, score, onRestart, questionFile }) {
  const { score: totalScore, correct, wrong, attempted, total } = score
  const accuracy = attempted > 0 ? ((correct / attempted) * 100).toFixed(1) : 0
  const pass = totalScore >= 40
  const [solutions, setSolutions] = useState([])
  const [expandedQuestion, setExpandedQuestion] = useState(null)

  useEffect(() => {
    loadSolutions()
  }, [])

  async function loadSolutions() {
    try {
      // Load answer file based on questionFile prop
      const qFile = questionFile || 'questions.json'
      let baseName = qFile.replace('.json', '')
      // Remove all spaces
      baseName = baseName.replace(/\s+/g, '')
      const answerFile = baseName + '-Answer.json'

      console.log('🔍 Student result loading solutions:')
      console.log('  Question file:', qFile)
      console.log('  Answer file:', answerFile)

      const res = await fetch(`/${answerFile}`, { cache: 'no-store' })
      if (!res.ok) {
        console.log('No answer file found, tried:', answerFile)
        return
      }
      const data = await res.json()
      setSolutions(data)
      console.log('✅ Loaded solutions from:', answerFile, '- Total:', data.length)
    } catch (err) {
      console.log('❌ Could not load solutions:', err)
    }
  }

  function getSolution(questionId) {
    return solutions.find(s => s.id === questionId || s.id.toString() === questionId.toString())?.solution || null
  }

  function toggleExpand(questionId) {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId)
  }

  return (
    <div className="result-summary">
      <div className="result-card">
        <div className="result-header">
          <h1 className="bengali">পরীক্ষা সম্পন্ন</h1>
          <p className="student-name bengali">{studentName}</p>
        </div>

        <div className={`score-display ${pass ? 'pass' : 'fail'}`}>
          <div className="score-value">{totalScore.toFixed(2)}</div>
          <div className="score-label bengali">মোট নম্বর: {total}</div>
          <div className={`status-badge ${pass ? 'pass' : 'fail'}`}>
            {pass ? '✓ পাস' : '✗ ফেল'}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value correct">{correct}</div>
            <div className="stat-label bengali">সঠিক</div>
          </div>
          <div className="stat-item">
            <div className="stat-value wrong">{wrong}</div>
            <div className="stat-label bengali">ভুল</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{attempted}</div>
            <div className="stat-label bengali">চেষ্টা</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{accuracy}%</div>
            <div className="stat-label bengali">সঠিকতা</div>
          </div>
        </div>

        <div className="answers-review">
          <h2 className="bengali">উত্তর পর্যালোচনা</h2>
          <div className="answers-list">
            {questions.map((q, idx) => {
              const selected = answers[q.id]
              const isCorrect = selected === q.correctOptionId
              const hasAnswer = selected !== undefined

              return (
                <div key={q.id} className={`answer-item ${isCorrect ? 'correct' : hasAnswer ? 'wrong' : 'unanswered'}`}>
                  <div className="answer-header">
                    <span className="question-num bengali">প্রশ্ন {idx + 1}</span>
                    {isCorrect && <span className="status-icon">✓</span>}
                    {hasAnswer && !isCorrect && <span className="status-icon wrong-icon">✗</span>}
                    {!hasAnswer && <span className="status-icon">—</span>}
                  </div>
                  <div className="answer-details">
                    {hasAnswer ? (
                      <>
                        <span className="bengali">আপনার উত্তর: {selected}</span>
                        <span className="bengali">সঠিক উত্তর: {q.correctOptionId}</span>
                      </>
                    ) : (
                      <span className="bengali">উত্তর দেওয়া হয়নি</span>
                    )}
                  </div>

                  {/* Solution toggle */}
                  {getSolution(q.id) && (
                    <div className="solution-toggle-section">
                      <button
                        className="solution-toggle-btn bengali"
                        onClick={() => toggleExpand(q.id)}
                      >
                        {expandedQuestion === q.id ? '▼' : '▶'} সমাধান দেখুন
                      </button>
                      {expandedQuestion === q.id && (
                        <div className="solution-box">
                          <div className="solution-header bengali">
                            <span className="solution-icon">💡</span>
                            <strong>সমাধান/ব্যাখ্যা:</strong>
                          </div>
                          <div className="solution-text bengali">
                            {getSolution(q.id)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <button className="restart-btn bengali" onClick={onRestart}>
          নতুন পরীক্ষা শুরু করুন
        </button>
      </div>
    </div>
  )
}

export default ResultSummary


