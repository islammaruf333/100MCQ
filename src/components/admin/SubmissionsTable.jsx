import { useState, useMemo } from 'react'
import './SubmissionsTable.css'

function SubmissionsTable({ submissions, onDelete, onDeleteStudent, date }) {
  const [selectedSubmission, setSelectedSubmission] = useState(null)

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
                const latestSubmission = student.submissions.sort((a,b) => b.timestamp - a.timestamp)[0]
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
                <h3 className="bengali">উত্তরসমূহ ({Object.keys(selectedSubmission.answers || {}).length} টি):</h3>
                <div className="answers-grid">
                  {Object.entries(selectedSubmission.answers || {}).map(([qid, ans]) => (
                    <div key={qid} className="answer-item">
                      <span className="question-id bengali">প্রশ্ন {qid}</span>
                      <span className="answer-value">{ans}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubmissionsTable


