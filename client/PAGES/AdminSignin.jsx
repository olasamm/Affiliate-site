import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setAuthHeader } from '../src/api'

export default function AdminSignin(){
  const navigate = useNavigate()
  const [emailOrUsername, setId] = useState('')
  const [password, setPw] = useState('')

  async function submit(e){
    e.preventDefault()
    try{
      const loginRes = await api.post('/auth/login', { emailOrUsername, password })
      const token = loginRes.data?.token
      
      // Set token in Authorization header
      if (token) {
        setAuthHeader(token)
        localStorage.setItem('token', token)
        document.cookie = `token=${token}; path=/;`
      }
      
      const me = await api.get('/auth/me')
      if(!me.data?.isAdmin){
        alert('Not an admin account')
        return
      }
      localStorage.setItem('isAdmin', 'true')
      navigate('/admin')
    }catch(err){
      alert(err?.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="auth-header animate-rise">
          <div className="brand-badge">A</div>
          <h1 className="auth-title">Admin sign in</h1>
          <p className="auth-sub">Restricted area. Authorized personnel only.</p>
        </div>
        <form onSubmit={submit} className="auth-card animate-fade-up">
          <div className="form-field">
            <label>Email or Username</label>
            <input className="input" value={emailOrUsername} onChange={e=>setId(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input type="password" className="input" value={password} onChange={e=>setPw(e.target.value)} required />
          </div>
          <button className="btn-primary">Sign In</button>
          <p className="auth-alt">Go back <Link to="/" className="text-link">Home</Link></p>
        </form>
      </div>
    </div>
  )
}


