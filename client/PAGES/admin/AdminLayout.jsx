import { Link, Outlet } from 'react-router-dom'

export default function AdminLayout(){
  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div className="container" style={{paddingTop:20,paddingBottom:20}}>
        <div className="card" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h1 className="feat-title" style={{margin:0}}>Admin Dashboard</h1>
          <nav style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            <Link to="/admin" className="btn btn-secondary">Overview</Link>
            <Link to="/admin/coupons" className="btn btn-secondary">Coupons</Link>
            <Link to="/admin/tasks" className="btn btn-secondary">Tasks</Link>
            <Link to="/admin/withdrawals" className="btn btn-secondary">Withdrawals</Link>
            <Link to="/admin/users" className="btn btn-secondary">Users</Link>
          </nav>
        </div>
        <div style={{marginTop:16}}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}



