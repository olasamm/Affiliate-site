import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext({ show: (msg, type) => {} })

export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(list => [...list, { id, message, type }])
    setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), 5000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(){
  return useContext(ToastContext)
}


