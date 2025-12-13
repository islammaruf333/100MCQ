import { useState, useMemo, useEffect } from 'react'
import './SubmissionsTable.css'

function SubmissionsTable({ submissions, onDelete, onDeleteStudent, date }) {
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [questions, setQuestions] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)

  useEffect(() => {
    loadQuestions()
  }, [])

  async function loadQuestions() {
    try {
      const res = await fetch('/questions.json', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error('Failed to load questions')
      }
      const data = await res.json()
      setQuestions(data)
    } catch (err) {
      console.error('Failed to load questions:', err)
    }
  }

  function isAnswerCorrect(questionId, studentAnswer) {
    const qid = typeof questionId === 'string' ? parseInt(questionId) : questionId
    const question = questions.find(q => q.id === qid || q.id.toString() === questionId.toString())
    if (!question) return null
    return question.correctAnswer === studentAnswer
  }

  function handleQuestionClick(questionId, studentAnswer) {
    const qid = typeof questionId === 'string' ? parseInt(questionId) : questionId
    const question = questions.find(q => q.id === qid || q.id.toString() === questionId.toString())
    if (question) {
      setSelectedQuestion({
        ...question,
        studentAnswer,
        isCorrect: question.correctAnswer === studentAnswer,
        isAnswered: studentAnswer !== undefined && studentAnswer !== null
      })
    }
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const submissionsByStudent = useMemo(() => {
    const groups = {}
    submissions.forEach(sub => {
      const studentKey = sub.studentId || sub.studentName
      if (!groups[studentKey]) {
        groups[studentKey] = {
          ...sub,
          submissions: []
        }
      }
      groups[studentKey].submissions.push(sub)
    })
    return Object.values(groups)
  }, [submissions])

  return (
    <div className="submissions-table-container">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="bengali">নাম</th>
              <th className="bengali">আইডি</th>
              <th className="bengali">সর্বশেষ স্কোর</th>
              <th className="bengali">জমা সংখ্যা</th>
              <th className="bengali">স্ট্যাটাস</th>
              <th className="bengali">বিস্তারিত</th>
              <th className="bengali">ছাত্র মুছুন</th>
            </tr>
          </thead>
          <tbody>
            {submissionsByStudent.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state bengali">
                  কোন উত্তর নেই
                </td>
              </tr>
            ) : (
              submissionsByStudent.map((student, idx) => {
                const latestSubmission = student.submissions.sort((a, b) => b.timestamp - a.timestamp)[0]
                return (
                  <tr key={idx}>
                    <td className="bengali">{student.studentName || 'Unknown'}</td>
                    <td className="bengali">{student.studentId || 'N/A'}</td>
                    <td className="score">{Number(latestSubmission.score || 0).toFixed(2)}</td>
                    <td className='bengali'>{student.submissions.length}</td>
                    <td>
                      <span className={`status-badge ${latestSubmission.pass ? 'pass' : 'fail'}`}>
                        {latestSubmission.pass ? 'পাস' : 'ফেল'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => setSelectedSubmission(latestSubmission)}
                      >
                        <span className="bengali">দেখুন</span>
                      </button>
                    </td>
                    <td>
                      <button
                        className="delete-btn bengali"
                        onClick={() => onDeleteStudent(student.studentName)}
                        title="ছাত্রের সকল উত্তর মুছুন"
                      >
                        ✗ ছাত্র মুছুন
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedSubmission && (
        <div className="detail-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="bengali">
                {selectedSubmission.studentName} - উত্তর বিস্তারিত
              </h2>
              <button
                className="close-btn"
                onClick={() => setSelectedSubmission(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-info">
                <div className="info-item main-score">
                  <span className="info-label bengali">স্কোর:</span>
                  <span className="info-value score-large">{Number(selectedSubmission.score || 0).toFixed(2)}</span>
                  <span className="info-suffix">/ {selectedSubmission.totalMarks || 100}</span>
                </div>
                <div className="info-item">
                  <span className="info-label bengali">সঠিক:</span>
                  <span className="info-value correct">{selectedSubmission.correct || 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label bengali">ভুল:</span>
                  <span className="info-value wrong">{selectedSubmission.wrong || 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label bengali">চেষ্টা:</span>
                  <span className="info-value">{selectedSubmission.attempted || 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label bengali">সময়:</span>
                  <span className="info-value">{formatDate(selectedSubmission.timestamp)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label bengali">স্ট্যাটাস:</span>
                  <span className={`info-value ${selectedSubmission.pass ? 'pass-status' : 'fail-status'}`}>
                    {selectedSubmission.pass ? '✓ পাস' : '✗ ফেল'}
                  </span>
                </div>
              </div>
              <div className="answers-detail">
                <h3 className="bengali">উত্তরসমূহ ({Object.keys(selectedSubmission.answers || {}).length} / {questions.length} টি):</h3>
                <div className="answers-grid">
                  {questions.map((question) => {
                    const qid = question.id.toString()
                    const ans = (selectedSubmission.answers || {})[qid]
                    const isAnswered = ans !== undefined && ans !== null
                    const correct = isAnswered ? isAnswerCorrect(qid, ans) : null

                    return (
                      <div
                        key={qid}
                        className={`answer-item ${!isAnswered ? 'unanswered' :
                          correct === true ? 'correct-answer' :
                            correct === false ? 'incorrect-answer' : ''
                          }`}
                        onClick={() => handleQuestionClick(qid, ans)}
                        style={{ cursor: 'pointer' }}
                        title="ক্লিক করে বিস্তারিত দেখুন"
                      >
                        <span className="question-id bengali">প্রশ্ন {qid}</span>
                        <span className="answer-value">{isAnswered ? ans : '—'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedQuestion && (
        <div className="question-detail-modal" onClick={() => setSelectedQuestion(null)}>
          <div className="question-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="question-modal-header">
              <h2 className="bengali">প্রশ্ন নং {selectedQuestion.id}</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedQuestion(null)}
              >
                ✕
              </button>
            </div>
            <div className="question-modal-body">
              <div className="question-text bengali">
                <strong>প্রশ্ন:</strong>
                <p>{selectedQuestion.question}</p>
              </div>

              <div className="options-list">
                <div className="option-item bengali">
                  <strong>A)</strong> {selectedQuestion.options.a}
                </div>
                <div className="option-item bengali">
                  <strong>B)</strong> {selectedQuestion.options.b}
                </div>
                <div className="option-item bengali">
                  <strong>C)</strong> {selectedQuestion.options.c}
                </div>
                <div className="option-item bengali">
                  <strong>D)</strong> {selectedQuestion.options.d}
                </div>
              </div>

              <div className="answer-details">
                {selectedQuestion.isAnswered ? (
                  <>
                    <div className={`student-answer ${selectedQuestion.isCorrect ? 'correct' : 'wrong'}`}>
                      <strong className="bengali">শিক্ষার্থীর উত্তর:</strong>
                      <span className="answer-badge">{selectedQuestion.studentAnswer}</span>
                      {selectedQuestion.isCorrect ? (
                        <span className="status-text correct bengali">✓ সঠিক</span>
                      ) : (
                        <span className="status-text wrong bengali">✗ ভুল</span>
                      )}
                    </div>
                    {!selectedQuestion.isCorrect && (
                      <div className="correct-answer-display">
                        <strong className="bengali">সঠিক উত্তর:</strong>
                        <span className="answer-badge correct">{selectedQuestion.correctAnswer}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-answer bengali">
                    <strong>শিক্ষার্থী এই প্রশ্নের উত্তর দেয়নি</strong>
                    <div className="correct-answer-display">
                      <strong className="bengali">সঠিক উত্তর:</strong>
                      <span className="answer-badge correct">{selectedQuestion.correctAnswer}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubmissionsTable


