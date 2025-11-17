import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from '../PAGES/LandingPage'
import Signup from '../PAGES/Signup'
import Signin from '../PAGES/Signin'
import Dashboards from '../PAGES/Dashboards'
import Profile from '../PAGES/Profile'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import AdminLayout from '../PAGES/admin/AdminLayout'
import AdminOverview from '../PAGES/admin/AdminOverview'
import AdminCoupons from '../PAGES/admin/AdminCoupons'
import AdminTasks from '../PAGES/admin/AdminTasks'
import AdminWithdrawals from '../PAGES/admin/AdminWithdrawals'
import AdminUsers from '../PAGES/admin/AdminUsers'
import AdminSignin from '../PAGES/AdminSignin'
import AdminSignup from '../PAGES/AdminSignup'


function App() {
  const [count, setCount] = useState(0)


  useEffect(() => { 
    if ('serviceworker' in navigator){
      navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log(`Service Worker registered, ${reg}`)
        console.log(reg);
        
      })
      .catch((err) => {
        console.log(`Service Worker not registered, ${regError}`)
        console.log(regError);
        
      })

    }
  }, []);

  return (
    <>
    <div className="z-index">
      
    {/* <Navbar /> */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/admin-signin" element={<AdminSignin />} />
        <Route path="/admin-signup" element={<AdminSignup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboards /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<RoleRoute requireAdmin={true}><AdminLayout /></RoleRoute>} >
          <Route index element={<AdminOverview />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
      </Routes>


      </div>

      
    </>
  )
}

export default App
