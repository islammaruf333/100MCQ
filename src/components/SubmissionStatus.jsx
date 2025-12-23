import './SubmissionStatus.css'

function SubmissionStatus({ status, retryCount, nextRetryIn, error }) {
    if (status === 'idle' || status === 'success') {
        return null
    }

    const getStatusText = () => {
        switch (status) {
            case 'submitting':
                return retryCount === 0 ? 'উত্তরপত্র জমা দেওয়া হচ্ছে...' : `পুনরায় চেষ্টা করা হচ্ছে (${retryCount})...`

            case 'retrying':
                const seconds = Math.ceil(nextRetryIn / 1000)
                return `নেটওয়ার্ক সমস্যা। ${seconds} সেকেন্ডে পুনরায় চেষ্টা করা হবে... (চেষ্টা ${retryCount}/10)`

            case 'failed':
                return 'সাবমিট করতে ব্যর্থ হয়েছে। দয়া করে পেজ রিফ্রেশ করুন।'

            default:
                return 'জমা দেওয়া হচ্ছে...'
        }
    }

    const getIcon = () => {
        switch (status) {
            case 'submitting':
                return '⏳'
            case 'retrying':
                return '🔄'
            case 'failed':
                return '⚠️'
            default:
                return '📤'
        }
    }

    const statusClass = status === 'failed' ? 'error' : status === 'retrying' ? 'warning' : 'info'

    return (
        <div className={`submission-status ${statusClass}`}>
            <div className="submission-status-content">
                <span className="submission-icon">{getIcon()}</span>
                <span className="submission-text bengali">{getStatusText()}</span>
            </div>
            {status === 'retrying' && (
                <div className="submission-progress">
                    <div className="progress-bar" style={{ animationDuration: `${nextRetryIn}ms` }}></div>
                </div>
            )}
        </div>
    )
}

export default SubmissionStatus
