import { Navigate } from 'react-router-dom'

export default function AdminRoute({ children }){
  const hasToken = document.cookie.split('; ').some(s => s.startsWith('token='))
  const isAdmin = localStorage.getItem('isAdmin') === 'true'
  if(!hasToken || !isAdmin){
    return <Navigate to="/signin" replace />
  }
  return children
}


