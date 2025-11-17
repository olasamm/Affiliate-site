import { useEffect, useState } from 'react'

export default function DarkModeToggle(){
  const [enabled, setEnabled] = useState(false)
  useEffect(()=>{
    const root = document.documentElement
    if(enabled) root.classList.add('dark')
    else root.classList.remove('dark')
  },[enabled])
  return (
    <button onClick={()=>setEnabled(v=>!v)} className="px-3 py-1.5 rounded-lg text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-200">
      {enabled ? 'Dark' : 'Light'}
    </button>
  )
}


