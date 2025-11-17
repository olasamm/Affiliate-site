import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {  HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { ToastProvider } from './Toast'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ToastProvider>
  </StrictMode>,
)