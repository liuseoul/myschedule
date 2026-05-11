'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [adminId,  setAdminId]  = useState('')
  const [password, setPassword] = useState('')
  const [code,     setCode]     = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleLogin() {
    if (!adminId.trim() || !password || !code.trim()) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: adminId.trim(), password, code: code.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Login failed')
        setLoading(false)
        return
      }
      const maxAge = 86400 * 30
      document.cookie = `qt_auth=1; path=/; max-age=${maxAge}; SameSite=Lax`
      document.cookie = `qt_uid=${encodeURIComponent(adminId.trim())}; path=/; max-age=${maxAge}; SameSite=Lax`
      window.location.href = json.subdomain ? `/${json.subdomain}/schedule` : '/pending'
    } catch {
      setError('Network error — please try again')
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 mb-4 shadow-lg shadow-teal-900/50">
            <span className="text-white text-2xl font-black">Q</span>
          </div>
          <h1 className="text-white text-2xl font-semibold mb-1">
            My<span className="font-black bg-gradient-to-r from-teal-300 to-teal-500 bg-clip-text text-transparent">Schedule</span>
          </h1>
          <p className="text-slate-400 text-sm">Sign in to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin ID</label>
            <input
              type="text" value={adminId} onChange={e => setAdminId(e.target.value)}
              onKeyDown={handleKey} placeholder="Enter admin ID" autoFocus autoComplete="username"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                         placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKey} placeholder="Enter password" autoComplete="current-password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                         placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification code</label>
            <input
              type="text" value={code} onChange={e => setCode(e.target.value)}
              onKeyDown={handleKey} placeholder="6-digit code" inputMode="numeric" maxLength={6}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-center tracking-[0.4em]
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                         placeholder:text-gray-400 placeholder:tracking-normal"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleLogin} disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400
                       text-white font-medium py-2.5 rounded-lg transition-colors duration-150
                       focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
