import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setAuthHeader } from '../src/api'
import { useToast } from '../src/Toast'

export default function Signin(){
  const navigate = useNavigate()
  const { show } = useToast()
  const [emailOrUsername, setId] = useState('')
  const [password, setPw] = useState('')

  async function submit(e){
    e.preventDefault()
    try{
      const loginRes = await api.post('/auth/login', { emailOrUsername, password })
      const token = loginRes.data?.token
      if(token){
        document.cookie = `token=${token}; path=/;`;
        setAuthHeader(token);
        localStorage.setItem('token', token);
        // Debug: log token and Axios header
        console.log('JWT token:', token);
        console.log('Axios Authorization header:', api.defaults.headers.common['Authorization']);
      }
      // Only proceed if /auth/me succeeds
      try {
        const me = await api.get('/auth/me')
        if (me && me.data) {
          const isAdmin = !!me.data?.isAdmin
          localStorage.setItem('isAdmin', String(isAdmin))
          show('Logged in successfully')
          navigate('/dashboard')
        } else {
          show('Authentication failed', 'error')
        }
      } catch (authErr) {
        show(authErr?.response?.data?.message || 'Authentication failed', 'error')
      }
    }catch(err){
      show(err?.response?.data?.message || 'Login failed', 'error')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="auth-header animate-rise">
          <div className="brand-badge">A</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to continue to your dashboard</p>
        </div>
        <form onSubmit={submit} className="auth-card animate-fade-up">
          <div className="form-field">
            <label>Email or Username</label>
            <input
              className="input"
              placeholder="you@example.com"
              value={emailOrUsername}
              onChange={e=>setId(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <div className="label-row">
              <label>Password</label>
              <a href="#" className="text-link small">Forgot?</a>
            </div>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={e=>setPw(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button className="btn-primary">Sign In</button>
          <p className="auth-alt">Don't have an account? <Link to="/signup" className="text-link">Sign up</Link></p>
        </form>
        <p className="auth-footer">By continuing, you agree to our Terms and Privacy Policy.</p>
      </div>
    </div>
  )
}



