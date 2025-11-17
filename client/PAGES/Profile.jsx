import { useEffect, useState } from 'react'
import { api } from '../src/api'

export default function Profile(){
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ name:'', phone:'', bankName:'', accountNumber:'' })
  useEffect(()=>{ (async()=>{ const r = await api.get('/user/profile'); setProfile(r.data); setForm({ name:r.data.name||'', phone:r.data.phone||'', bankName:r.data.bankName||'', accountNumber:r.data.accountNumber||'' }) })() },[])
  async function save(e){
    e.preventDefault()
    const r = await api.patch('/user/profile', form)
    setProfile(r.data)
    alert('Profile updated')
  }
  if(!profile) return <div className="min-h-screen grid place-items-center text-gray-600">Loading...</div>
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50 to-blue-100">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-indigo-700">Profile</h2>
          <form onSubmit={save} className="mt-4 grid md:grid-cols-2 gap-4">
            {[
              ['name','Full Name'],
              ['phone','Phone Number'],
              ['bankName','Bank Name'],
              ['accountNumber','Account Number'],
            ].map(([k,label]) => (
              <div key={k}>
                <label className="text-sm text-gray-600">{label}</label>
                <input className="mt-1 w-full border rounded px-3 py-2" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} />
              </div>
            ))}
            <button className="md:col-span-2 mt-2 px-4 py-2 rounded bg-indigo-600 text-white">Save</button>
          </form>
        </div>
      </div>
    </div>
  )
}


