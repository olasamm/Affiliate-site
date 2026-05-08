import { useEffect, useState } from 'react'
import { api } from '../../src/api'

export default function AdminOverview(){
  const [data, setData] = useState(null)
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [nowMs, setNowMs] = useState(Date.now())

  async function load(){
    const [overviewRes, settingsRes] = await Promise.all([
      api.get('/admin/overview'),
      api.get('/admin/withdrawal-settings')
    ])
    setData(overviewRes.data)
    setSettings(settingsRes.data)
  }

  useEffect(()=>{ load() },[])

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  function getCountdownLabel(){
    if (!settings?.enabled || !settings?.endAt) return 'Withdrawals are currently OFF'
    const diffMs = new Date(settings.endAt).getTime() - nowMs
    if (diffMs <= 0) return 'Auto-close time reached (will close on next request)'
    const totalSec = Math.floor(diffMs / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    return `Auto-closes in ${h}h ${m}m ${s}s`
  }

  async function saveSettings(e){
    e.preventDefault()
    if(!settings) return
    setSaving(true)
    try{
      const payload = {
        enabled: !!settings.enabled,
        autoCloseMinutes: Number(settings.autoCloseMinutes) || 60,
      }
      const r = await api.patch('/admin/withdrawal-settings', payload)
      setSettings(r.data)
      alert('Withdrawal settings updated')
    }catch(err){
      alert(err?.response?.data?.message || 'Failed to update settings')
    }finally{
      setSaving(false)
    }
  }

  if(!data) return <div style={{minHeight:'30vh',display:'grid',placeItems:'center'}}>Loading...</div>
  return (
    <div style={{display:'grid',gap:12}}>
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

      <form className="card" onSubmit={saveSettings}>
        <h3 style={{marginTop:0}}>Withdrawal Control</h3>
        <div style={{display:'grid',gap:10}}>
          <label style={{display:'flex',gap:8,alignItems:'center'}}>
            <input
              type="checkbox"
              checked={!!settings?.enabled}
              onChange={(e)=>setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
            />
            Enable user withdrawals
          </label>

          <label>
            <div className="muted" style={{fontSize:12,marginBottom:4}}>Auto-close after (minutes)</div>
            <input
              type="number"
              className="input"
              min="1"
              value={settings?.autoCloseMinutes || 60}
              onChange={(e)=>setSettings(prev => ({ ...prev, autoCloseMinutes: e.target.value }))}
            />
          </label>

          <div className="muted" style={{fontSize:12}}>
            When enabled and saved, withdrawals will auto-turn-off after this time.
          </div>

          <div className="muted" style={{fontSize:13,fontWeight:600}}>
            {getCountdownLabel()}
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Withdrawal Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}



