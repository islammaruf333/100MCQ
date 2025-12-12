import { useState, useEffect, useMemo } from 'react'
import { loadSubmissions, deleteSubmission } from '../utils/api'
import AdminHeader from '../components/admin/AdminHeader'
import DateFilter from '../components/admin/DateFilter'
import SubmissionsTable from '../components/admin/SubmissionsTable'
import StatisticsCard from '../components/admin/StatisticsCard'
import DateSectionCard from '../components/admin/DateSectionCard'
import NotificationToast from '../components/admin/NotificationToast'
import './AdminPage.css'

function AdminPage() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [notification, setNotification] = useState(null)

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
      await loadData() // Reload data
      setNotification({ message: `${studentName} এর উত্তর সফলভাবে মুছে ফেলা হয়েছে`, type: 'success' })
    } catch (err) {
      console.error('Delete failed:', err)
      setNotification({ message: `মুছে ফেলতে সমস্যা হয়েছে: ${err.message}`, type: 'error' })
    }
  }

  // Group submissions by date
  const groupedByDate = useMemo(() => {
    const groups = {}
    submissions.forEach(sub => {
      const date = new Date(sub.timestamp).toISOString().split('T')[0]
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(sub)
    })
    return groups
  }, [submissions])

  // Get dates sorted (newest first)
  const dates = useMemo(() => {
    return Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))
  }, [groupedByDate])

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions

    // Filter by date
    if (selectedDate) {
      filtered = groupedByDate[selectedDate] || []
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(sub =>
        sub.studentName?.toLowerCase().includes(term) ||
        sub.studentId?.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [submissions, selectedDate, searchTerm, groupedByDate])

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading">লোড হচ্ছে...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="error">
          <p>লোড করতে সমস্যা হয়েছে: {error}</p>
          <button onClick={loadData}>আবার চেষ্টা করুন</button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <AdminHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={loadData}
        totalSubmissions={submissions.length}
        lastRefresh={lastRefresh}
        autoRefresh={autoRefresh}
        onAutoRefreshToggle={setAutoRefresh}
        loading={loading}
      />
      
      <DateFilter
        dates={dates}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        groupedByDate={groupedByDate}
      />

      {selectedDate ? (
        <SubmissionsTable
          submissions={filteredSubmissions}
          onDelete={handleDelete}
          date={selectedDate}
        />
      ) : (
        <>
          <StatisticsCard submissions={submissions} groupedByDate={groupedByDate} />
          <div className="date-sections">
            {dates.length === 0 ? (
              <div className="empty-dates bengali">
                <p>কোন উত্তর নেই</p>
              </div>
            ) : (
              dates.map(date => {
                const dateSubs = groupedByDate[date]
                const passCount = dateSubs.filter(s => s.pass).length
                const failCount = dateSubs.length - passCount
                return (
                  <DateSectionCard
                    key={date}
                    date={date}
                    count={dateSubs.length}
                    passCount={passCount}
                    failCount={failCount}
                    onView={() => setSelectedDate(date)}
                  />
                )
              })
            )}
          </div>
        </>
      )}
      
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

