import { useEffect, useState } from 'react'
import { api } from '../../src/api'

export default function AdminOverview(){
  const [data, setData] = useState(null)
  useEffect(()=>{ (async()=>{ const r = await api.get('/admin/overview'); setData(r.data) })() },[])
  if(!data) return <div style={{minHeight:'30vh',display:'grid',placeItems:'center'}}>Loading...</div>
  return (
    <div className="grid grid-3" style={{gap:12}}>
      {[{
        label:'Total Users', value: data.totalUsers
      },{
        label:'Coupons', value: `${data.coupons.total} (Unused ${data.coupons.unused})`
      },{
        label:'Pending Withdrawals', value: data.pendingWithdrawals
      },{
        label:'Total Tasks', value: data.totalTasks
      }].map(({label,value}) => (
        <div key={label} className="card">
          <div className="muted" style={{fontSize:12}}>{label}</div>
          <div style={{marginTop:8,fontSize:20,fontWeight:800}}>{value}</div>
        </div>
      ))}
    </div>
  )
}



