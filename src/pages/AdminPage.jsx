import { useState, useEffect, useMemo } from 'react'
import { loadSubmissions, deleteSubmission, deleteStudent } from '../utils/api'
import SubmissionsTable from '../components/admin/SubmissionsTable'
import NotificationToast from '../components/admin/NotificationToast'
import './AdminPage.css'

function AdminPage() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lastRefresh, setLastRefresh] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [notification, setNotification] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    loadData()
  }, [])

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
      const data = await loadSubmissions()
      setSubmissions(data)
      setError(null)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err.message)
      console.error('Failed to load submissions', err)
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

    try {
      await deleteStudent(studentName)
      await loadData()
      setNotification({ message: `${studentName} এর সকল উত্তর সফলভাবে মুছে ফেলা হয়েছে`, type: 'success' })
    } catch (err) {
      console.error('Delete failed:', err)
      setNotification({ message: `মুছে ফেলতে সমস্যা হয়েছে: ${err.message}`, type: 'error' })
    }
  }

  // Group submissions by student (latest only)
  const submissionsByStudent = useMemo(() => {
    const groups = {}
    submissions.forEach(sub => {
      const studentKey = sub.studentId || sub.studentName
      if (!groups[studentKey] || new Date(sub.timestamp) > new Date(groups[studentKey].timestamp)) {
        groups[studentKey] = sub
      }
    })
    return Object.values(groups)
  }, [submissions])

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
    if (statusFilter !== 'all') {
      const isPassed = statusFilter === 'pass'
      filtered = filtered.filter(sub => sub.pass === isPassed)
    }

    // Sort by timestamp - most recent first
    filtered = filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

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
            <option value="pass">পাস</option>
            <option value="fail">ফেল</option>
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
