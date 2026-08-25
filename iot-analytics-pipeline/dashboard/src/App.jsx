import React, { useState } from 'react'
import Dashboard from './components/Dashboard'
import Login from './components/Login'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('iot_token'))

  function handleLogin(t) {
    localStorage.setItem('iot_token', t)
    setToken(t)
  }

  function handleLogout() {
    localStorage.removeItem('iot_token')
    setToken(null)
  }

  if (!token) return <Login onLogin={handleLogin} />
  return <Dashboard token={token} onLogout={handleLogout} />
}
