import { useEffect, useState } from 'react'
import { api } from '../../src/api'

export default function AdminWithdrawals(){
  const [list, setList] = useState([])
  async function load(){ const r = await api.get('/admin/withdrawals'); setList(r.data) }
  useEffect(()=>{ load() },[])
  async function approve(id){ await api.post(`/admin/withdrawals/${id}/approve`); load() }
  async function reject(id){ await api.post(`/admin/withdrawals/${id}/reject`); load() }
  return (
    <div className="card">
      <h3 className="feat-title" style={{margin:0}}>Withdrawals</h3>
      <div style={{marginTop:12,display:'grid',gap:10}}>
        {list.map(w => (
          <div key={w._id} className="card" style={{padding:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:700}}>₦{w.amount} • {w?.userId?.username}</div>
              <div className="muted" style={{fontSize:13}}>{w.bankName} • {w.accountNumber}</div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:13,color: w.status==='Approved'?'#065f46': w.status==='Rejected'?'#7f1d1d':'var(--text)'}}>{w.status}</span>
              <button onClick={()=>approve(w._id)} className="btn" style={{background:'#10b981',color:'#fff',padding:'8px 10px',borderRadius:10}}>Approve</button>
              <button onClick={()=>reject(w._id)} className="btn" style={{background:'#ef4444',color:'#fff',padding:'8px 10px',borderRadius:10}}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}



