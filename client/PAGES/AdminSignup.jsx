import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../src/api'

export default function AdminSignup(){
  const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', username:'', email:'', password:'', adminSecret:'' })

  async function submit(e){
    e.preventDefault()
    try{
      await api.post('/auth/register', { ...form })
      const me = await api.get('/auth/me')
      if(!me.data?.isAdmin){
        alert('Invalid admin secret')
        return
      }
      localStorage.setItem('isAdmin', 'true')
      navigate('/admin')
    }catch(err){
      alert(err?.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="auth-header animate-rise">
          <div className="brand-badge">A</div>
          <h1 className="auth-title">Admin sign up</h1>
          <p className="auth-sub">Provide admin secret to create an admin account.</p>
        </div>
        <form onSubmit={submit} className="auth-card animate-fade-up">
          {[
            ['name','Full Name'],
            ['username','Username'],
            ['email','Email'],
          ].map(([k,label]) => (
            <div className="form-field" key={k}>
              <label>{label}</label>
              <input className="input" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} required />
            </div>
          ))}
          <div className="form-field">
            <label>Password</label>
            <input type="password" className="input" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
          </div>
          <div className="form-field">
            <label>Admin Secret</label>
            <input className="input" value={form.adminSecret} onChange={e=>setForm({...form,adminSecret:e.target.value})} required />
          </div>
          <button className="btn-primary">Create Admin</button>
          <p className="auth-alt">Already admin? <Link to="/admin-signin" className="text-link">Sign in</Link></p>
        </form>
      </div>
    </div>
  )
}


