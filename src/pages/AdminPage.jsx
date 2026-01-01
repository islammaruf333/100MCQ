import { useState, useEffect, useMemo } from 'react'
import { loadSubmissions, deleteSubmission, deleteStudent, loadPendingStudents, removePendingStudent, loadExamConfig, updateExamConfig, loadQuestionFiles, uploadQuestionFile } from '../utils/api'
import SubmissionsTable from '../components/admin/SubmissionsTable'
import NotificationToast from '../components/admin/NotificationToast'
import './AdminPage.css'

function AdminPage() {
  const [submissions, setSubmissions] = useState([])
  const [pendingStudents, setPendingStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lastRefresh, setLastRefresh] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [notification, setNotification] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Exam config state
  const [examConfig, setExamConfig] = useState(null)
  const [initialConfig, setInitialConfig] = useState(null) // Track original config for change detection
  const [selectedExamType, setSelectedExamType] = useState('type1')
  const [updatingConfig, setUpdatingConfig] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [availableFiles, setAvailableFiles] = useState([])

  useEffect(() => {
    loadData()
    loadCurrentConfig()
    loadFiles()
  }, [])

  async function loadFiles() {
    try {
      const files = await loadQuestionFiles()
      setAvailableFiles(files)
    } catch (err) {
      console.error('Failed to load question files:', err)
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  async function loadData() {
    try {
      setLoading(true)
      const [submissionsData, pendingData] = await Promise.all([
        loadSubmissions(),
        loadPendingStudents().catch(() => []) // Don't fail if pending students file doesn't exist
      ])
      setSubmissions(submissionsData)
      setPendingStudents(pendingData)
      setError(null)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err.message)
      console.error('Failed to load data', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(studentName, timestamp) {
    if (!window.confirm(`আপনি কি ${studentName} এর উত্তর মুছে ফেলতে চান?\n\nএই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।`)) {
      return
    }

    try {
      await deleteSubmission(studentName, timestamp)
      await loadData()
      setNotification({ message: `${studentName} এর উত্তর সফলভাবে মুছে ফেলা হয়েছে`, type: 'success' })
    } catch (err) {
      console.error('Delete failed:', err)
      setNotification({ message: `মুছে ফেলতে সমস্যা হয়েছে: ${err.message}`, type: 'error' })
    }
  }

  async function handleDeleteStudent(studentName) {
    if (!window.confirm(`আপনি কি ${studentName} এর সকল উত্তর মুছে ফেলতে চান?\n\nএই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।`)) {
      return
    }

    // Check if this is a pending student
    const student = submissionsByStudent.find(s => s.studentName === studentName)
    const isPending = student?.isPending === true

    try {
      if (isPending) {
        // Delete from pending students table
        console.log(`Deleting pending student: ${studentName}`)
        await removePendingStudent(studentName)
      } else {
        // Delete from submissions table
        console.log(`Deleting submitted student: ${studentName}`)
        await deleteStudent(studentName)
      }
      await loadData()
      const successMessage = isPending
        ? `${studentName} পেন্ডিং তালিকা থেকে সফলভাবে মুছে ফেলা হয়েছে`
        : `${studentName} এর সকল উত্তর সফলভাবে মুছে ফেলা হয়েছে`
      setNotification({ message: successMessage, type: 'success' })
    } catch (err) {
      console.error('Delete failed:', err)
      setNotification({ message: `মুছে ফেলতে সমস্যা হয়েছে: ${err.message}`, type: 'error' })
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    // Validation: File type
    if (!file.name.endsWith('.json')) {
      setNotification({ message: 'শুধুমাত্র .json ফাইল আপলোড করা যাবে', type: 'error' })
      return
    }

    // Validation: Size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setNotification({ message: 'ফাইলের আকার অনেক বড় (সর্বোচ্চ ৫ মেগাবাইট)', type: 'error' })
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        // Validation: JSON Syntax
        const content = JSON.parse(event.target.result)

        // Validation: JSON Schema (Array)
        if (!Array.isArray(content)) {
          setNotification({ message: 'ফাইলের ফরম্যাট সঠিক নয় (JSON Array হতে হবে)', type: 'error' })
          return
        }

        if (!window.confirm(`আপনি কি "${file.name}" ফাইলটি আপলোড করতে চান? এতে ${content.length} টি প্রশ্ন আছে।`)) {
          e.target.value = ''
          return
        }

        setUploadingFile(true)
        await uploadQuestionFile(file.name, content)
        await loadFiles()
        setNotification({ message: 'প্রশ্ন ফাইল সফলভাবে আপলোড হয়েছে!', type: 'success' })
        e.target.value = ''
      } catch (err) {
        console.error('Upload failed:', err)
        setNotification({ message: `আপলোড ব্যর্থ হয়েছে: ${err.message}`, type: 'error' })
      } finally {
        setUploadingFile(false)
      }
    }
    reader.readAsText(file)
  }

  async function loadCurrentConfig() {
    try {
      const config = await loadExamConfig()
      setExamConfig(config)
      setInitialConfig(JSON.parse(JSON.stringify(config))) // Deep clone for comparison
      setSelectedExamType(config.currentType || 'type1')
    } catch (err) {
      console.error('Failed to load exam config:', err)
      setNotification({ message: `কনফিগারেশন লোড করতে সমস্যা হয়েছে: ${err.message}`, type: 'error' })
    }
  }

  async function handleUpdateExamType() {
    if (!window.confirm(`আপনি কি পরিবর্তন সংরক্ষণ করতে চান?`)) {
      return
    }

    try {
      setUpdatingConfig(true)
      // Save current selected type AND the full configuration for type1 and type2
      // This ensures any changes to files/names are also saved
      await updateExamConfig({
        currentType: selectedExamType,
        type1: examConfig.type1,
        type2: examConfig.type2
      })
      await loadCurrentConfig()
      setNotification({
        message: `পরীক্ষার ধরন এবং কনফিগারেশন সফলভাবে আপডেট হয়েছে`,
        type: 'success'
      })
    } catch (err) {
      console.error('Failed to update exam config:', err)
      setNotification({ message: `কনফিগারেশন আপডেট করতে সমস্যা হয়েছে: ${err.message}`, type: 'error' })
    } finally {
      setUpdatingConfig(false)
    }
  }

  // Group submissions by student (latest only) and merge with pending students
  const submissionsByStudent = useMemo(() => {
    const groups = {}

    // Add all submissions
    submissions.forEach(sub => {
      const studentKey = sub.studentId || sub.studentName
      if (!groups[studentKey] || new Date(sub.timestamp) > new Date(groups[studentKey].timestamp)) {
        groups[studentKey] = sub
      }
    })

    // Add pending students who haven't submitted yet
    pendingStudents.forEach(pending => {
      const studentKey = pending.studentName
      if (!groups[studentKey]) {
        // Calculate elapsed time to check if expired
        const now = Date.now()
        const start = new Date(pending.timestamp).getTime()
        const elapsed = now - start
        const minutes = Math.floor(elapsed / (1000 * 60))
        const TIMEOUT_THRESHOLD = 70

        // This student is pending and hasn't submitted
        groups[studentKey] = {
          ...pending,
          studentName: pending.studentName,
          timestamp: pending.timestamp,
          status: 'Pending',
          isPending: true,
          isExpired: minutes > TIMEOUT_THRESHOLD,
          elapsedMinutes: minutes
        }
      }
      // If student already submitted, ignore the pending entry
    })

    return Object.values(groups)
  }, [submissions, pendingStudents])

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = submissionsByStudent

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(sub =>
        sub.studentName?.toLowerCase().includes(term) ||
        sub.studentId?.toLowerCase().includes(term)
      )
    }

    // Filter by status
    if (statusFilter === 'pending') {
      filtered = filtered.filter(sub => sub.isPending === true && !sub.isExpired)
    } else if (statusFilter === 'timeout') {
      filtered = filtered.filter(sub => sub.isPending === true && sub.isExpired === true)
    } else if (statusFilter === 'pass') {
      filtered = filtered.filter(sub => !sub.isPending && sub.pass === true)
    } else if (statusFilter === 'fail') {
      filtered = filtered.filter(sub => !sub.isPending && sub.pass === false)
    } else if (statusFilter === 'all') {
      // Show everything except expired pending students
      filtered = filtered.filter(sub => !sub.isExpired)
    } else if (statusFilter === 'all-including-expired') {
      // Show absolutely everything including expired
      // No filter needed
    }
    // Default: filter out expired pending students

    // Sort: Pending first, then by timestamp - most recent first
    filtered = filtered.sort((a, b) => {
      // Pending students come first
      if (a.isPending && !b.isPending) return -1
      if (!a.isPending && b.isPending) return 1
      // Otherwise sort by timestamp
      return new Date(b.timestamp) - new Date(a.timestamp)
    })

    return filtered
  }, [submissionsByStudent, searchTerm, statusFilter])

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage)
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Stats
  const stats = useMemo(() => {
    const total = submissionsByStudent.length
    const passed = submissionsByStudent.filter(s => s.pass).length
    const failed = total - passed
    const avgScore = total > 0
      ? (submissionsByStudent.reduce((sum, s) => sum + (s.score || 0), 0) / total).toFixed(1)
      : 0
    return { total, passed, failed, avgScore }
  }, [submissionsByStudent])

  if (error) {
    return (
      <div className="admin-page">
        <div className="error-state">
          <h2 className="bengali">লোড করতে সমস্যা হয়েছে</h2>
          <p>{error}</p>
          <button onClick={loadData} className="export-button">আবার চেষ্টা করুন</button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <h1 className="bengali">শিক্ষার্থী ডাটাবেস</h1>
        <div className="admin-header-right">
          <div className="stats-badge bengali">
            মোট: <strong>{stats.total}</strong>
          </div>
          <button
            className="icon-button"
            onClick={() => setShowConfigModal(true)}
            title="পরীক্ষা কনফিগারেশন"
          >
            ⚙️
          </button>
          <button
            className={`icon-button ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? 'অটো রিফ্রেশ চালু' : 'অটো রিফ্রেশ বন্ধ'}
          >
            🔄
          </button>
          <button
            className="icon-button"
            onClick={loadData}
            title="রিফ্রেশ করুন"
            disabled={loading}
          >
            ↻
          </button>
        </div>
      </div>

      {/* Exam Configuration Modal - Refactored */}
      {showConfigModal && examConfig && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowConfigModal(false)
        }}>
          <div className="config-modal">
            <div className="config-modal-header">
              <h2 className="bengali">পরীক্ষা কনফিগারেশন</h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowConfigModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="config-section">
              {/* Exam Type Selection */}
              <div className="form-group">
                <label className="form-label bengali">বর্তমান পরীক্ষার ধরন নির্বাচন করুন:</label>
                <select
                  className="filter-select bengali"
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                  disabled={updatingConfig}
                  style={{ width: '100%' }}
                >
                  <option value="type1">{examConfig.type1?.label || 'Type 1: ৮০ প্রশ্ন - ৬০ মিনিট'}</option>
                  <option value="type2">{examConfig.type2?.label || 'Type 2: ২৫ প্রশ্ন - ১৮:৪৫ মিনিট'}</option>
                </select>
              </div>

              {/* Question File Selection */}
              <div className="form-group">
                <label className="form-label bengali">প্রশ্ন ফাইল নির্বাচন করুন:</label>
                <select
                  className="filter-select"
                  value={examConfig[selectedExamType]?.questionFile}
                  onChange={(e) => {
                    const newFile = e.target.value;
                    setExamConfig(prev => ({
                      ...prev,
                      [selectedExamType]: {
                        ...prev[selectedExamType],
                        questionFile: newFile
                      }
                    }))
                  }}
                  disabled={updatingConfig}
                  style={{ width: '100%' }}
                >
                  {availableFiles.map(file => (
                    <option key={file} value={file}>{file}</option>
                  ))}
                </select>
              </div>

              {/* Active Config Details */}
              <div className="config-details-card">
                <div className="details-title bengali">সক্রিয় কনফিগারেশন বিস্তারিত</div>
                <div className="active-config-name bengali">{examConfig[selectedExamType]?.label}</div>
                <div className="config-meta bengali">
                  <span>প্রশ্ন: <strong>{examConfig[selectedExamType]?.totalQuestions}</strong></span>
                  <span>•</span>
                  <span>সময়: <strong>{Math.floor(examConfig[selectedExamType]?.durationSeconds / 60)} মিনিট</strong></span>
                  <span>•</span>
                  <span>পাস মার্ক: <strong>{examConfig[selectedExamType]?.passMark}</strong></span>
                </div>
              </div>

              {/* Question Upload Section */}
              <div className="upload-section">
                <div className="file-input-wrapper">
                  <label className="form-label bengali">নতুন প্রশ্ন আপলোড করুন (.json):</label>
                  <input
                    type="file"
                    accept=".json"
                    className="file-input"
                    disabled={uploadingFile}
                    onChange={handleFileUpload}
                  />
                  {uploadingFile && (
                    <div className="upload-feedback">
                      <div className="small-spinner"></div>
                      <span className="bengali">আপলোড হচ্ছে...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="form-group">
                <button
                  className="save-config-btn bengali"
                  onClick={async () => {
                    await handleUpdateExamType();
                  }}
                  disabled={
                    updatingConfig ||
                    !initialConfig ||
                    (selectedExamType === initialConfig.currentType &&
                      examConfig[selectedExamType]?.questionFile === initialConfig[selectedExamType]?.questionFile)
                  }
                >
                  {updatingConfig ? (
                    <>
                      <div className="small-spinner" style={{ width: '18px', height: '18px', borderTopColor: 'white' }}></div>
                      আপডেট হচ্ছে...
                    </>
                  ) : (
                    '💾 কনফিগারেশন আপডেট করুন'
                  )}
                </button>

                {initialConfig && (selectedExamType !== initialConfig.currentType ||
                  examConfig[selectedExamType]?.questionFile !== initialConfig[selectedExamType]?.questionFile) && (
                    <div className="warning-message bengali">
                      ⚠ পরিবর্তন সংরক্ষিত হয়নি - বাটনে ক্লিক করে সেভ করুন
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="admin-content">
        {/* Filter Bar */}
        <div className="filter-bar">
          <input
            type="text"
            className="search-input bengali"
            placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="filter-select bengali"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">সকল স্ট্যাটাস</option>
            <option value="pending">পেন্ডিং</option>
            <option value="timeout">টাইম আউট</option>
            <option value="pass">পাস</option>
            <option value="fail">ফেল</option>
            <option value="all-including-expired">সব (টাইম আউট সহ)</option>
          </select>

          <button className="export-button bengali" onClick={() => alert('Export feature coming soon!')}>
            📥 Export CSV
          </button>
        </div>

        {/* Data Table */}
        <SubmissionsTable
          submissions={paginatedSubmissions}
          onDelete={handleDelete}
          onDeleteStudent={handleDeleteStudent}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSubmissions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Notification Toast */}
      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}

export default AdminPage
