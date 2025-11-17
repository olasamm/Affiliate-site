import { Link } from 'react-router-dom'
import { useState } from 'react'
import DarkModeToggle from '../src/DarkModeToggle'

export default function LandingPage(){
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div style={{minHeight:'100vh',background:'#fff'}}>
      <header className="lp-header">
        <div className="container lp-bar" style={{paddingTop:20,paddingBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Link to="/" className="lp-brand">
            <div className="lp-brand-badge" />
            <span className="lp-brand-text">Affiliate Platform</span>
          </Link>
          <nav className="lp-nav">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="lp-actions">
            <DarkModeToggle />
            <Link to="/signin">Sign in</Link>
            <Link to="/signup" className="btn btn-primary">Get Started</Link>
          </div>
          <button aria-label="Toggle menu" className="lp-mobile-toggle" onClick={()=>setMenuOpen(v=>!v)}>
            <span className={"bar" + (menuOpen?" open":"")} />
            <span className={"bar" + (menuOpen?" open":"")} />
            <span className={"bar" + (menuOpen?" open":"")} />
          </button>
        </div>
        {menuOpen && (
          <div className="lp-mobile-panel animate-fade-up">
            <nav>
              <a href="#features" onClick={()=>setMenuOpen(false)}>Features</a>
              <a href="#how" onClick={()=>setMenuOpen(false)}>How it works</a>
              <a href="#contact" onClick={()=>setMenuOpen(false)}>Contact</a>
            </nav>
            <div className="lp-mobile-actions">
              <DarkModeToggle />
              <Link to="/signin" onClick={()=>setMenuOpen(false)}>Sign in</Link>
              <Link to="/signup" className="btn btn-primary" onClick={()=>setMenuOpen(false)}>Get Started</Link>
            </div>
          </div>
        )}
      </header>

      <section className="hero hero-bg">
        <div className="container hero-inner section grid grid-2" style={{alignItems:'center'}}>
          <div>
            <h1 className="title">A global platform to grow affiliate income</h1>
            <p className="lead">Join a modern affiliate ecosystem used worldwide. Complete brand-safe tasks, build your network, and manage payouts with clarity.</p>
            <div style={{marginTop:20,display:'flex',gap:12,flexWrap:'wrap'}}>
              <Link to="/signup" className="btn btn-primary">Create free account</Link>
              <Link to="/signin" className="btn btn-secondary">Sign in</Link>
            </div>
            <div className="stats">
              {[
                ['150+','countries'],
                ['24/7','uptime'],
                ['1M+','tasks done'],
              ].map(([k,v])=> (
                <div key={k} className="stat-card">
                  <div className="stat-k">{k}</div>
                  <div className="stat-v">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="card" style={{position:'relative'}}>
              <div style={{position:'absolute',inset:-8,borderRadius:24,background:'linear-gradient(90deg,#a5b4fc,#93c5fd)',filter:'blur(20px)',opacity:.5,zIndex:0}} />
              <div className="card" style={{position:'relative',zIndex:1,background:'#fff'}}>
                <div className="card" style={{background:'linear-gradient(90deg,var(--indigo),var(--blue))',color:'#fff'}}>
                  <div className="chip">Unified Dashboard</div>
                  <div className="money">Track tasks, referrals & payouts</div>
                  <div className="chip">Mobile-first, blazing fast</div>
                </div>
                <ul style={{marginTop:16,color:'#334155',fontSize:14,lineHeight:'22px'}}>
                  <li>• Secure authentication and protected routes</li>
                  <li>• Referral links and real-time earnings</li>
                  <li>• Manual payouts with full history</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="brands section">
        <div className="container brands-inner">
          {['ACME','POLAR','NOVA','ZENCO','ALPHA'].map(b => (
            <div key={b} className="brand">{b}</div>
          ))}
        </div>
      </section>

      <section id="features" className="section features">
        <div className="container features-grid">
          {[
            {t:'Global reach', d:'Operate in 150+ countries with CDN-backed performance.', icon:'🌍'},
            {t:'Bank-grade security', d:'JWT auth, encrypted passwords, strict role control.', icon:'🛡️'},
            {t:'Transparent earnings', d:'Separate task/referral balances, instant updates.', icon:'📈'},
          ].map(({t,d,icon}) => (
            <div key={t} className="feature-card animate-fade-up">
              <div className="feature-icon">{icon}</div>
              <div className="feature-body">
                <div className="feature-title">{t}</div>
                <div className="feature-desc">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="section" style={{background:'linear-gradient(90deg,#eef2ff,#dbeafe)'}}>
        <div className="container">
          <h2 className="feat-title" style={{textAlign:'center'}}>How it works</h2>
          <div className="grid how-grid" style={{marginTop:24}}>
            {[
              { title:'Get access', desc:'Request a coupon from an admin.', icon:'🔐' },
              { title:'Create account', desc:'Register securely and set bank details.', icon:'🧾' },
              { title:'Complete tasks', desc:'Earn by doing quality daily actions.', icon:'✅' },
              { title:'Withdraw', desc:'Request payouts on allowed days.', icon:'💸' },
            ].map(s => (
              <div key={s.title} className="card" style={{textAlign:'center'}}>
                <div style={{fontSize:28}}>{s.icon}</div>
                <div className="feat-title" style={{marginTop:8}}>{s.title}</div>
                <div className="feat-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="section">
        <div className="container cta" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
          <div>
            <h3 style={{fontSize:24,fontWeight:800,margin:0}}>Build your affiliate income globally</h3>
            <p style={{opacity:.9,marginTop:4}}>Start now. It’s fast, secure and designed for growth.</p>
          </div>
          <div className="cta-actions">
            <Link to="/signup" className="btn" style={{background:'#fff',color:'#4338ca',padding:'12px 20px',borderRadius:12}}>Create account</Link>
            <Link to="/signin" className="btn" style={{border:'1px solid rgba(255,255,255,.4)',color:'#fff',padding:'12px 20px',borderRadius:12}}>Sign in</Link>
          </div>
        </div>
      </section>

      <footer style={{padding:'40px 0',textAlign:'center',fontSize:12,color:'#64748b'}}>
        © {new Date().getFullYear()} Affiliate Platform. All rights reserved.
      </footer>
    </div>
  )
}


