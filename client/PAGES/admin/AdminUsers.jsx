import { useEffect, useState } from 'react'
import { api } from '../../src/api'

export default function AdminUsers(){
  const [list, setList] = useState([])
  useEffect(()=>{ (async()=>{ const r = await api.get('/admin/users'); setList(r.data) })() },[])
  return (
    <div className="card">
      <h3 className="feat-title" style={{margin:0}}>Users</h3>
      <div style={{marginTop:12,overflowX:'auto'}}>
        <table style={{width:'100%',fontSize:14,borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th style={{textAlign:'left',padding:8}}>Name</th>
              <th style={{textAlign:'left',padding:8}}>Username</th>
              <th style={{textAlign:'left',padding:8}}>Email</th>
              <th style={{textAlign:'left',padding:8}}>Plan</th>
              <th style={{textAlign:'left',padding:8}}>Task</th>
              <th style={{textAlign:'left',padding:8}}>Referral</th>
            </tr>
          </thead>
          <tbody>
            {list.map(u => (
              <tr key={u._id} style={{borderTop:'1px solid #e5e7eb'}}>
                <td style={{padding:8}}>{u.name}</td>
                <td style={{padding:8}}>{u.username}</td>
                <td style={{padding:8}}>{u.email}</td>
                <td style={{padding:8}}>{u.planType}</td>
                <td style={{padding:8}}>₦{u.taskBalance}</td>
                <td style={{padding:8}}>₦{u.referralBalance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}



