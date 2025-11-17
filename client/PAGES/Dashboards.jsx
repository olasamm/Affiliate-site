import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../src/api'
import { useToast } from '../src/Toast'

export default function Dashboards(){
  const [profile, setProfile] = useState(null)
  const [tasks, setTasks] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [referral, setReferral] = useState({})
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const { show } = useToast()
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/signin');
  }

  useEffect(()=>{
    ;(async()=>{
      try{
        const me = await api.get('/user/profile')
        setProfile(me.data)
        const t = await api.get('/user/tasks')
        setTasks(t.data)
        const w = await api.get('/user/withdrawals')
        setWithdrawals(w.data)
        const r = await api.get('/user/referrals')
        setReferral(r.data)
      }catch{}
    })()
  },[])

  async function completeTask(id){
    const res = await api.post(`/user/tasks/${id}/complete`)
    show(`+₦${res.data.taskReward} added to Task Balance`, 'success')
    const me = await api.get('/user/profile')
    setProfile(me.data)
    const t = await api.get('/user/tasks')
    setTasks(t.data)
  }

  function openWithdrawalModal(){
    setShowWithdrawalModal(true)
    setWithdrawalAmount('')
  }

  function closeWithdrawalModal(){
    setShowWithdrawalModal(false)
    setWithdrawalAmount('')
  }

  async function submitWithdrawal(e){
    e.preventDefault()
    const amount = Number(withdrawalAmount)
    if(!amount || amount <= 0) {
      show('Please enter a valid amount', 'error')
      return
    }
    const total = (profile.taskBalance||0) + (profile.referralBalance||0)
    if(amount > total) {
      show('Insufficient balance', 'error')
      return
    }
    const bankName = profile.bankName
    const accountNumber = profile.accountNumber
    if(!bankName || !accountNumber) {
      show('Please update your bank details in profile', 'error')
      return
    }
    try {
    await api.post('/user/withdrawals', { amount, bankName, accountNumber })
      show('Withdrawal request submitted successfully', 'success')
    const w = await api.get('/user/withdrawals')
    setWithdrawals(w.data)
      const me = await api.get('/user/profile')
      setProfile(me.data)
      closeWithdrawalModal()
    } catch(err) {
      show(err?.response?.data?.message || 'Withdrawal failed', 'error')
    }
  }

  function copyReferralLink() {
    if (referral.referralLink) {
      navigator.clipboard.writeText(referral.referralLink)
      show('Referral link copied!', 'success')
    }
  }

  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  function formatBalance(amount) {
    if (!balanceVisible) return '••••••'
    return new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace('NGN', '₦')
  }

  if(!profile) return <div className="loading-screen">Loading...</div>
  const total = (profile.taskBalance||0) + (profile.referralBalance||0)
  const lastUpdated = new Date().toLocaleString('en-US', { 
    month: 'short', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  }).replace(',', '')

  return (
    <div className="affiliate-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="app-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            </div>
          <div className="header-greeting">
            <span>{getGreeting()} 👋</span>
            <span className="header-name">{profile.name}</span>
              </div>
            </div>
        <div className="header-right">
          <button className="icon-btn notification-btn">
            <span>🔔</span>
            {withdrawals.filter(w => w.status === 'Pending').length > 0 && (
              <span className="notification-badge">{withdrawals.filter(w => w.status === 'Pending').length}+</span>
            )}
          </button>
        </div>
      </header>

      {/* Earnings Card */}
      <div className="earnings-card">
        <div className="earnings-card-header">
          <div>
            <div className="earnings-label">Total Earnings</div>
            <div className="earnings-username">@{profile.username}</div>
          </div>
          <div className="plan-badge">
            <span className="plan-label">Plan</span>
            <span className="plan-type">{profile.planType?.toUpperCase()}</span>
            </div>
            </div>
        
        <div className="earnings-balance-section">
          <div className="balance-label">Available Balance</div>
          <div className="balance-amount-row">
            <div className="balance-amount">{formatBalance(total)}</div>
            <button 
              className="eye-toggle" 
              onClick={() => setBalanceVisible(!balanceVisible)}
              aria-label="Toggle balance visibility"
            >
              {balanceVisible ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div className="earnings-card-footer">
          <div className="account-status">
            <span className="status-dot"></span>
            <span>Active Member</span>
          </div>
          <div className="last-updated">Updated: {lastUpdated}</div>
        </div>
      </div>

      {/* Balance Breakdown */}
      <div className="balance-breakdown">
        <div className="breakdown-item">
          <span className="breakdown-label">Task Earnings</span>
          <span className="breakdown-value">₦{profile.taskBalance || 0}</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">Referral Earnings</span>
          <span className="breakdown-value">₦{profile.referralBalance || 0}</span>
        </div>
      </div>

        {/* Balance Breakdown - More Prominent */}
        <div className="balance-breakdown-large">
          <div className="breakdown-card task">
            <div className="breakdown-icon">✅</div>
            <div className="breakdown-content">
              <span className="breakdown-label">Task Balance</span>
              <span className="breakdown-value">₦{profile.taskBalance || 0}</span>
            </div>
          </div>
          <div className="breakdown-card referral">
            <div className="breakdown-icon">👥</div>
            <div className="breakdown-content">
              <span className="breakdown-label">Referral Balance</span>
              <span className="breakdown-value">₦{profile.referralBalance || 0}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-header">
          <div className="quick-actions">
            <button className="quick-action-btn primary" onClick={openWithdrawalModal}>
              <span className="action-icon">💸</span>
              <span>Withdraw</span>
            </button>
            <button className="quick-action-btn secondary" onClick={copyReferralLink}>
              <span className="action-icon">🔗</span>
              <span>Copy Referral Link</span>
            </button>
            <Link to="/profile" className="quick-action-btn secondary">
              <span className="action-icon">👤</span>
              <span>Profile</span>
            </Link>
          </div>
        </div>

      {/* Content Area */}
      <div className="dashboard-content">
        {activeTab === 'home' && (
          <>
            {/* Two Column Layout for Desktop */}
            <div className="content-grid">
              {/* Tasks Section */}
              <div className="content-section">
                <h3 className="section-title">Today's Tasks</h3>
                <div className="tasks-list">
                  {tasks.length === 0 ? (
                    <div className="empty-state">No tasks assigned today.</div>
                  ) : (
                    tasks.map(t => (
                      <div key={t._id} className="task-card">
                        <div className="task-content">
                          <div className="task-title">{t.title}</div>
                          <div className="task-reward">₦{t.reward}</div>
                    {t.mediaType === 'image' && t.mediaUrl && (
                            <img src={t.mediaUrl} alt="task" className="task-media" />
                    )}
                    {t.mediaType === 'video' && t.mediaUrl && (
                            <video controls className="task-media" src={t.mediaUrl} />
                    )}
                    {t.linkUrl && (
                            <a href={t.linkUrl} target="_blank" rel="noreferrer" className="task-link">
                              {t.ctaLabel || 'Open'}
                            </a>
                          )}
                        </div>
                        <button onClick={() => completeTask(t._id)} className="task-complete-btn">
                          Complete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Withdrawals Section */}
              <div className="content-section">
                <h3 className="section-title">Withdrawal Requests</h3>
                <div className="withdrawals-list">
                  {withdrawals.length === 0 ? (
                    <div className="empty-state">No withdrawal requests yet.</div>
                  ) : (
                    withdrawals.map(w => (
                      <div key={w._id} className="withdrawal-card">
                        <div className="withdrawal-info">
                          <div className="withdrawal-amount">₦{w.amount}</div>
                          <div className="withdrawal-date">
                            {new Date(w.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className={`withdrawal-status status-${w.status.toLowerCase()}`}>
                          {w.status}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Referral Section */}
            {referral.referralLink && (
              <div className="referral-section">
                <h3 className="section-title">Your Referral Link</h3>
                <div className="referral-card">
                  <div className="referral-code">
                    <span className="referral-label">Referral Code:</span>
                    <span className="referral-code-value">{profile.referralCode}</span>
                  </div>
                  <div className="referral-link-container">
                    <input 
                      type="text" 
                      value={referral.referralLink} 
                      readOnly 
                      className="referral-link-input"
                    />
                    <button onClick={copyReferralLink} className="copy-btn">
                      📋 Copy
                    </button>
                  </div>
                  <p className="referral-hint">Share this link to earn commissions when people sign up!</p>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'tasks' && (
          <div className="content-section">
            <h3 className="section-title">All Tasks</h3>
            <div className="tasks-list">
              {tasks.length === 0 ? (
                <div className="empty-state">No tasks available at the moment.</div>
              ) : (
                tasks.map(t => (
                  <div key={t._id} className="task-card">
                    <div className="task-content">
                      <div className="task-title">{t.title}</div>
                      <div className="task-reward">₦{t.reward}</div>
                      {t.mediaType === 'image' && t.mediaUrl && (
                        <img src={t.mediaUrl} alt="task" className="task-media" />
                      )}
                      {t.mediaType === 'video' && t.mediaUrl && (
                        <video controls className="task-media" src={t.mediaUrl} />
                      )}
                      {t.linkUrl && (
                        <a href={t.linkUrl} target="_blank" rel="noreferrer" className="task-link">
                          {t.ctaLabel || 'Open'}
                        </a>
                      )}
                    </div>
                    <button onClick={() => completeTask(t._id)} className="task-complete-btn">
                      Complete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="content-section">
            <h3 className="section-title">Withdrawal History</h3>
            <div className="withdrawals-list">
              {withdrawals.length === 0 ? (
                <div className="empty-state">No withdrawal requests yet.</div>
              ) : (
                withdrawals.map(w => (
                  <div key={w._id} className="withdrawal-card">
                    <div className="withdrawal-info">
                      <div className="withdrawal-amount">₦{w.amount}</div>
                      <div className="withdrawal-details">
                        <div className="withdrawal-date">
                          {new Date(w.createdAt).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="withdrawal-bank">{w.bankName} • {w.accountNumber}</div>
                      </div>
                    </div>
                    <div className={`withdrawal-status status-${w.status.toLowerCase()}`}>
                      {w.status}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button onClick={openWithdrawalModal} className="quick-action-btn primary" style={{marginTop: 24}}>
              Request New Withdrawal
            </button>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="content-section">
            <h3 className="section-title">Referral Program</h3>
            {referral.referralLink ? (
              <div className="referral-section">
                <div className="referral-card">
                  <div className="referral-code">
                    <span className="referral-label">Your Referral Code:</span>
                    <span className="referral-code-value">{profile.referralCode}</span>
                  </div>
                  <div className="referral-link-container">
                    <input 
                      type="text" 
                      value={referral.referralLink} 
                      readOnly 
                      className="referral-link-input"
                    />
                    <button onClick={copyReferralLink} className="copy-btn">
                      📋 Copy
                    </button>
                  </div>
                  <div className="referral-stats">
                    <div className="stat-item">
                      <span className="stat-label">Referral Earnings</span>
                      <span className="stat-value">₦{profile.referralBalance || 0}</span>
                    </div>
                  </div>
                  <p className="referral-hint">Share your referral link to earn commissions. You get paid when people sign up using your link!</p>
                </div>
              </div>
            ) : (
              <div className="empty-state">Referral link not available.</div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="content-section">
            <h3 className="section-title">Profile</h3>
            <div className="profile-actions">
              <Link to="/profile" className="quick-action-btn primary">
                View Full Profile
              </Link>
              <button onClick={handleLogout} className="quick-action-btn secondary" style={{marginTop: 12}}>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar Navigation */}
      <aside className="desktop-sidebar">
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </button>
          <button 
            className={`sidebar-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <span className="nav-icon">✅</span>
            <span className="nav-label">Tasks</span>
          </button>
          <button 
            className={`sidebar-nav-item ${activeTab === 'withdrawals' ? 'active' : ''}`}
            onClick={() => setActiveTab('withdrawals')}
          >
            <span className="nav-icon">💸</span>
            <span className="nav-label">Withdrawals</span>
          </button>
          <button 
            className={`sidebar-nav-item ${activeTab === 'referrals' ? 'active' : ''}`}
            onClick={() => setActiveTab('referrals')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Referrals</span>
          </button>
          <button 
            className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Profile</span>
          </button>
          <button 
            className="sidebar-nav-item logout-btn"
            onClick={handleLogout}
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <span className="nav-icon">✅</span>
          <span className="nav-label">Tasks</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'withdrawals' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          <span className="nav-icon">💸</span>
          <span className="nav-label">Withdraw</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'referrals' ? 'active' : ''}`}
          onClick={() => setActiveTab('referrals')}
        >
          <span className="nav-icon">👥</span>
          <span className="nav-label">Referrals</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">Profile</span>
        </button>
      </nav>

      {/* Withdrawal Modal Card */}
      {showWithdrawalModal && (
        <div className="modal-overlay" onClick={closeWithdrawalModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Request Withdrawal</h3>
              <button className="modal-close-btn" onClick={closeWithdrawalModal}>×</button>
            </div>
            <form onSubmit={submitWithdrawal} className="modal-body">
              <div className="modal-balance-info">
                <div className="modal-balance-item">
                  <span className="modal-balance-label">Task Balance:</span>
                  <span className="modal-balance-value">₦{profile.taskBalance || 0}</span>
                </div>
                <div className="modal-balance-item">
                  <span className="modal-balance-label">Referral Balance:</span>
                  <span className="modal-balance-value">₦{profile.referralBalance || 0}</span>
                </div>
                <div className="modal-balance-item total">
                  <span className="modal-balance-label">Total Available:</span>
                  <span className="modal-balance-value">₦{((profile.taskBalance||0) + (profile.referralBalance||0))}</span>
                </div>
              </div>
              
              <div className="form-field">
                <label htmlFor="withdrawal-amount">Withdrawal Amount (₦)</label>
                <input
                  id="withdrawal-amount"
                  type="number"
                  className="input"
                  placeholder="Enter amount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  min="1"
                  max={(profile.taskBalance||0) + (profile.referralBalance||0)}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-bank-info">
                <div className="bank-info-item">
                  <span className="bank-info-label">Bank Name:</span>
                  <span className="bank-info-value">{profile.bankName || 'Not set'}</span>
                </div>
                <div className="bank-info-item">
                  <span className="bank-info-label">Account Number:</span>
                  <span className="bank-info-value">{profile.accountNumber || 'Not set'}</span>
                </div>
                {(!profile.bankName || !profile.accountNumber) && (
                  <div className="bank-warning">
                    <span>⚠️ Please update your bank details in </span>
                    <Link to="/profile" className="bank-link" onClick={closeWithdrawalModal}>Profile</Link>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeWithdrawalModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
