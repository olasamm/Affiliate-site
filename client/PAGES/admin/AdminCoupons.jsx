import { useEffect, useState } from 'react'
import { api, setAuthHeader } from '../../src/api'
import { useNavigate } from 'react-router-dom'

export default function AdminCoupons(){
  const [list, setList] = useState([])
  const [form, setForm] = useState({ planType:'5k', amount:5000, quantity:10, prefix:'CPN' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Ensure token is loaded from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setAuthHeader(token)
    }
  }, [])

  async function load(){ 
    try {
      const r = await api.get('/admin/coupons')
      setList(r.data)
      setError('')
    } catch(err) {
      console.error('Error loading coupons:', err)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError('Authentication failed. Please log in again.')
        navigate('/admin-signin')
      } else {
        setError(err?.response?.data?.message || 'Failed to load coupons')
      }
    }
  }
  
  useEffect(()=>{ load() },[])

  async function generate(e){
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      // Ensure token is set before making request
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Not authenticated. Please log in again.')
        navigate('/admin-signin')
        return
      }
      
      setAuthHeader(token)
      
      console.log('Generating coupons with:', { planType: form.planType, amount: Number(form.amount), quantity: Number(form.quantity), prefix: form.prefix })
      
      await api.post('/admin/coupons/bulk', { 
        planType: form.planType, 
        amount: Number(form.amount), 
        quantity: Number(form.quantity), 
        prefix: form.prefix 
      })
      
      setForm({ planType:'5k', amount:5000, quantity:10, prefix:'CPN' })
      await load()
    } catch(err) {
      console.error('Error generating coupons:', err?.response?.data || err)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError('Authentication failed. Please log in again.')
        setTimeout(() => navigate('/admin-signin'), 2000)
      } else {
        setError(err?.response?.data?.message || 'Failed to generate coupons')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-2" style={{gap:16}}>
      <form onSubmit={generate} className="card" style={{display:'grid',gap:12}}>
        <h3 className="feat-title" style={{margin:0}}>Generate Coupons</h3>
        {error && (
          <div style={{padding:12,background:'#fee2e2',color:'#7f1d1d',borderRadius:8,border:'1px solid #ef4444',fontSize:14}}>
            {error}
          </div>
        )}
        <div className="grid" style={{gap:8}}>
          <label className="muted" style={{fontSize:12}}>Plan Type</label>
          <select className="input" value={form.planType} onChange={e=>setForm({...form,planType:e.target.value})}>
            <option value="5k">5k</option><option value="10k">10k</option><option value="15k">15k</option>
          </select>
        </div>
        <div className="grid" style={{gap:8}}>
          <label className="muted" style={{fontSize:12}}>Amount</label>
          <input type="number" className="input" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form,amount:Number(e.target.value)})} required />
        </div>
        <div className="grid" style={{gap:8}}>
          <label className="muted" style={{fontSize:12}}>Quantity</label>
          <input type="number" className="input" placeholder="Quantity" value={form.quantity} onChange={e=>setForm({...form,quantity:Number(e.target.value)})} min={1} max={1000} required />
        </div>
        <div className="grid" style={{gap:8}}>
          <label className="muted" style={{fontSize:12}}>Code Prefix</label>
          <input className="input" placeholder="Prefix (e.g., CPN)" value={form.prefix} onChange={e=>setForm({...form,prefix:e.target.value})} />
        </div>
        <button className="btn btn-primary" disabled={isLoading}>{isLoading? 'Generating...' : 'Generate'}</button>
      </form>
      <div className="card">
        <h3 className="feat-title" style={{margin:0}}>Coupons</h3>
        <div style={{marginTop:12,display:'grid',gap:10}}>
          {list.map(c => (
            <div key={c._id} className="card" style={{padding:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontWeight:700}}>{c.code} • {c.planType}</div>
                <div className="muted" style={{fontSize:13}}>{c.status}</div>
              </div>
              <div className="muted" style={{fontSize:12}}>₦{c.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}



