import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../src/api'

export default function Profile(){
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ name:'', phone:'', bankName:'', accountNumber:'' })
  useEffect(()=>{ (async()=>{ const r = await api.get('/user/profile'); setProfile(r.data); setForm({ name:r.data.name||'', phone:r.data.phone||'', bankName:r.data.bankName||'', accountNumber:r.data.accountNumber||'' }) })() },[])
  async function save(e){
    e.preventDefault()
    const r = await api.patch('/user/profile', form)
    setProfile(r.data)
    alert('Profile updated')
  }
  if(!profile) return <div className="loading-screen">Loading...</div>
  return (
    <div className="affiliate-dashboard">
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
            <span>Account</span>
            <span className="header-name">@{profile.username}</span>
          </div>
        </div>
        <div className="header-right">
          <Link to="/dashboard" className="btn btn-secondary">
            Back
          </Link>
        </div>
      </header>

      <div className="dashboard-content" style={{paddingTop: 8}}>
        <div className="content-section" style={{maxWidth: 720, margin: '0 auto'}}>
          <h3 className="section-title">Profile</h3>

          <div className="dash-card" style={{padding: 18}}>
            <form onSubmit={save} style={{display:'grid', gap: 14}}>
              {[
                ['name','Full Name'],
                ['phone','Phone Number'],
                ['bankName','Bank Name'],
                ['accountNumber','Account Number'],
              ].map(([k,label]) => (
                <div className="form-field" key={k}>
                  <label className="dash-label">{label}</label>
                  <input
                    className="dash-input"
                    value={form[k]}
                    onChange={e=>setForm({...form,[k]:e.target.value})}
                  />
                </div>
              ))}

              <div className="profile-actions-row" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12, marginTop: 6}}>
                <Link to="/dashboard" className="btn btn-secondary" style={{textAlign:'center'}}>
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}


