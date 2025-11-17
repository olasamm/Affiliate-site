import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api, setAuthHeader } from './api'

export default function RoleRoute({ children, requireAdmin = false }){
  const [state, setState] = useState({ loading: true, isAuthed: false, isAdmin: false })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try{
        // Ensure token is loaded from localStorage before making request
        const token = localStorage.getItem('token')
        if (token) {
          setAuthHeader(token)
        }
        
        const { data } = await api.get('/auth/me')
        console.log('RoleRoute /auth/me response:', data)
        if(!mounted) return
        setState({ loading: false, isAuthed: true, isAdmin: !!data?.isAdmin })
      }catch(err){
        console.log('RoleRoute /auth/me error:', err?.response?.data || err)
        if(!mounted) return
        setState({ loading: false, isAuthed: false, isAdmin: false })
      }
    })()
    return () => { mounted = false }
  }, [])

  if(state.loading){
    return <div style={{minHeight:'60vh',display:'grid',placeItems:'center'}}><div>Loading…</div></div>
  }

  if(!state.isAuthed){
    return <Navigate to="/signin" replace />
  }

  if(requireAdmin && !state.isAdmin){
    return <Navigate to="/dashboard" replace />
  }

  return children
}


