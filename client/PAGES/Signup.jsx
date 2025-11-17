import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { api, setAuthHeader } from '../src/api'
import { useToast } from '../src/Toast'

export default function Signup(){
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const { show } = useToast()
  const [form, setForm] = useState({
    name:'', username:'', email:'', phone:'', bankName:'', accountNumber:'', password:'', planType:'5k', couponCode:'', invitationCode:''
  })
  useEffect(()=>{
    const invite = sp.get('invite')
    if(invite) setForm(f=>({...f, invitationCode: invite}))
  },[])

  async function submit(e){
    e.preventDefault()
    try{
      // Trim all string fields to remove whitespace
      const trimmedForm = {
        ...form,
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        couponCode: form.couponCode.trim(),
        invitationCode: form.invitationCode.trim(),
      }
      
      console.log('Submitting registration:', trimmedForm)
      const response = await api.post('/auth/register', trimmedForm)
      show('Registered successfully')
      
      // Set token if provided
      if (response.data?.token) {
        setAuthHeader(response.data.token)
      }
      
      navigate('/dashboard')
    }catch(err){
      const errorMessage = err?.response?.data?.message || err?.message || 'Registration failed'
      console.error('Registration error:', err?.response?.data || err)
      show(errorMessage, 'error')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="auth-header animate-rise">
          <div className="brand-badge">A</div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Join and start earning with the plan that fits you</p>
        </div>
        <form onSubmit={submit} className="auth-card grid-2 animate-fade-up">
          {[
            ['name','Full Name'],
            ['username','Username'],
            ['email','Email'],
            ['phone','Phone Number'],
            ['bankName','Bank Name'],
            ['accountNumber','Account Number'],
          ].map(([key,label])=> (
            <div key={key} className="form-field">
              <label>{label}</label>
              <input className="input" value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} required />
            </div>
          ))}
          <div className="form-field">
            <label>Password</label>
            <input type="password" className="input" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
          </div>
          <div className="form-field">
            <label>Plan Type</label>
            <select className="input" value={form.planType} onChange={e=>setForm({...form,planType:e.target.value})}>
              <option value="5k">₦5k</option>
              <option value="10k">₦10k</option>
              <option value="15k">₦15k</option>
            </select>
          </div>
          <div className="form-field">
            <label>Coupon Code</label>
            <input className="input" value={form.couponCode} onChange={e=>setForm({...form,couponCode:e.target.value})} required />
          </div>
          <div className="form-field">
            <label>Invitation Code</label>
            <input className="input" value={form.invitationCode} onChange={e=>setForm({...form,invitationCode:e.target.value})} />
          </div>
          <div className="form-row between">
            <label className="checkbox">
              <input type="checkbox" required />
              <span>I agree to the Terms and Privacy Policy</span>
            </label>
            <span className="muted">Already have an account? <Link to="/signin" className="text-link">Sign in</Link></span>
          </div>
          <button className="btn-primary">Create account</button>
        </form>
        <p className="auth-footer">Need help? Contact support.</p>
      </div>
    </div>
  )
}



