import React, { useState } from 'react'

const API = 'http://localhost:5000'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (mode === 'signup' && password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const endpoint = mode === 'signup' ? '/auth/signup' : '/auth/login'
      const res = await fetch(API + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Authentication failed')
      onLogin(data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const field = (label, value, onChange, type='text', placeholder='') => (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', color:'#64748b', fontSize:11, letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required
        style={{ width:'100%', background:'#111f38', border:'1px solid #1e3050', borderRadius:8,
          padding:'11px 14px', color:'#e2e8f0', fontSize:14, outline:'none', boxSizing:'border-box' }} />
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'radial-gradient(ellipse at 60% 30%, #0d2040 0%, #060d1a 70%)' }}>
      <div style={{ background:'#0b1629', border:'1px solid #1e3050', borderRadius:16,
        padding:'40px 44px', width:400, boxShadow:'0 40px 80px #00000066' }}>

        <div style={{ marginBottom:28 }}>
          <div style={{ color:'#22d3a5', fontFamily:'monospace', fontSize:22, fontWeight:'bold', letterSpacing:2 }}>IOTPULSE</div>
          <div style={{ color:'#64748b', fontSize:13, marginTop:4 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {field('Username', username, e => setUsername(e.target.value), 'text', 'Enter your username')}
          {field('Password', password, e => setPassword(e.target.value), 'password', 'Enter your password')}
          {mode === 'signup' && field('Confirm Password', confirm, e => setConfirm(e.target.value), 'password', 'Repeat your password')}

          {error && (
            <div style={{ background:'#ef444411', border:'1px solid #ef444433', borderRadius:8,
              padding:'10px 14px', color:'#ef4444', fontSize:13, marginBottom:16 }}>{error}</div>
          )}

          <button type="submit" disabled={loading}
            style={{ width:'100%', background: loading ? '#134e3a' : '#22d3a5', color:'#060d1a',
              border:'none', borderRadius:8, padding:13, fontWeight:'bold', fontSize:14,
              cursor: loading ? 'not-allowed' : 'pointer', letterSpacing:1 }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ borderTop:'1px solid #1e3050', marginTop:24, paddingTop:20, textAlign:'center' }}>
          {mode === 'login' ? (
            <span style={{ color:'#64748b', fontSize:13 }}>
              No account?{' '}
              <button onClick={() => { setMode('signup'); setError('') }}
                style={{ background:'none', border:'none', color:'#22d3a5', cursor:'pointer', fontSize:13, fontWeight:'bold' }}>
                Sign Up
              </button>
            </span>
          ) : (
            <span style={{ color:'#64748b', fontSize:13 }}>
              Already registered?{' '}
              <button onClick={() => { setMode('login'); setError('') }}
                style={{ background:'none', border:'none', color:'#22d3a5', cursor:'pointer', fontSize:13, fontWeight:'bold' }}>
                Sign In
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  )
}
