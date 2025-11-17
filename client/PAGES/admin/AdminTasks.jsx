import { useEffect, useState } from 'react'
import { api, setAuthHeader } from '../../src/api'
import { useNavigate } from 'react-router-dom'

export default function AdminTasks(){
  const [list, setList] = useState([])
  const [form, setForm] = useState({ title:'', description:'', planType:'5k', reward:500, assignedDate:new Date().toISOString().slice(0,10), mediaUrl:'', mediaType:'none', linkUrl:'', ctaLabel:'Open' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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
      const r = await api.get('/admin/tasks')
      setList(r.data)
      setError('')
    } catch(err) {
      console.error('Error loading tasks:', err)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError('Authentication failed. Please log in again.')
        navigate('/admin-signin')
      } else {
        setError(err?.response?.data?.message || 'Failed to load tasks')
      }
    }
  }
  
  useEffect(()=>{ load() },[])
  
  async function create(e){
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
      
      console.log('Creating task with:', { ...form, assignedDate: new Date(form.assignedDate) })
      
      await api.post('/admin/tasks', { ...form, assignedDate: new Date(form.assignedDate) })
      setForm({ title:'', description:'', planType:'5k', reward:500, assignedDate:new Date().toISOString().slice(0,10), mediaUrl:'', mediaType:'none', linkUrl:'', ctaLabel:'Open' })
      await load()
    } catch(err) {
      console.error('Error creating task:', err?.response?.data || err)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError('Authentication failed. Please log in again.')
        setTimeout(() => navigate('/admin-signin'), 2000)
      } else {
        setError(err?.response?.data?.message || 'Failed to create task')
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  async function onFile(e){
    const file = e.target.files?.[0]
    if(!file) return
    
    // Ensure token is set before making request
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Not authenticated. Please log in again.')
      navigate('/admin-signin')
      return
    }
    
    setAuthHeader(token)
    
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await api.post('/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' }})
      setForm(f => ({ ...f, mediaUrl: r.data.url, mediaType: r.data.type }))
      setError('')
    } catch(err) {
      console.error('Error uploading file:', err?.response?.data || err)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError('Authentication failed. Please log in again.')
        navigate('/admin-signin')
      } else {
        setError(err?.response?.data?.message || 'Failed to upload file')
      }
    }
  }
  return (
    <div className="grid grid-2" style={{gap:16}}>
      <form onSubmit={create} className="card" style={{display:'grid',gap:12}}>
        <h3 className="feat-title" style={{margin:0}}>Create Task</h3>
        {error && (
          <div style={{padding:12,background:'#fee2e2',color:'#7f1d1d',borderRadius:8,border:'1px solid #ef4444',fontSize:14}}>
            {error}
          </div>
        )}
        <input className="input" placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required />
        <textarea className="input" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required />
        <select className="input" value={form.planType} onChange={e=>setForm({...form,planType:e.target.value})}>
          <option value="all">All Plans (auto-scale reward)</option>
          <option value="5k">5k</option><option value="10k">10k</option><option value="15k">15k</option>
        </select>
        <input type="number" className="input" placeholder="Reward" value={form.reward} onChange={e=>setForm({...form,reward:Number(e.target.value)})} required />
        <input type="date" className="input" value={form.assignedDate} onChange={e=>setForm({...form,assignedDate:e.target.value})} required />
        <select className="input" value={form.mediaType} onChange={e=>setForm({...form,mediaType:e.target.value})}>
          <option value="none">No media</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="link">External Link</option>
        </select>
        <input className="input" placeholder="Media URL (image/video)" value={form.mediaUrl} onChange={e=>setForm({...form,mediaUrl:e.target.value})} />
        <input type="file" onChange={onFile} />
        <input className="input" placeholder="Link URL (e.g. business page)" value={form.linkUrl} onChange={e=>setForm({...form,linkUrl:e.target.value})} />
        <input className="input" placeholder="CTA Label (e.g. Promote, Visit)" value={form.ctaLabel} onChange={e=>setForm({...form,ctaLabel:e.target.value})} />
        <button className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create'}
        </button>
      </form>
      <div className="card">
        <h3 className="feat-title" style={{margin:0}}>Tasks</h3>
        <div style={{marginTop:12,display:'grid',gap:10}}>
          {list.map(t => (
            <div key={t._id} className="card" style={{padding:12}}>
              <div style={{fontWeight:700}}>{t.title} • {t.planType} • ₦{t.reward}</div>
              <div className="muted" style={{fontSize:13}}>{new Date(t.assignedDate).toDateString()}</div>
              {t.mediaType === 'image' && t.mediaUrl && (
                <img src={t.mediaUrl} alt="task" style={{marginTop:8,maxWidth:'100%',borderRadius:12}} />
              )}
              {t.mediaType === 'video' && t.mediaUrl && (
                <video controls style={{marginTop:8,maxWidth:'100%',borderRadius:12}} src={t.mediaUrl} />
              )}
              {t.linkUrl && (
                <a href={t.linkUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{marginTop:8,display:'inline-block'}}>{t.ctaLabel||'Open'}</a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}



