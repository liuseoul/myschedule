'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function BrandName() {
  return (
    <span className="text-2xl font-semibold">
      My<span
        className="font-black bg-gradient-to-r from-teal-300 via-teal-400 to-teal-500 bg-clip-text text-transparent"
      >Schedule</span>
    </span>
  )
}

export default function PendingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)

  const [showCreate,    setShowCreate]    = useState(false)
  const [groupNameCn,   setGroupNameCn]   = useState('')
  const [groupNameEn,   setGroupNameEn]   = useState('')
  const [managerNameEn, setManagerNameEn] = useState('')
  const [creating,      setCreating]      = useState(false)
  const [createMsg,     setCreateMsg]     = useState('')

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )qt_uid=([^;]*)/)
    setUserId(match ? decodeURIComponent(match[1]) : null)
  }, [])

  const previewSubdomain = (groupNameEn + managerNameEn)
    .toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40)

  async function handleCreate() {
    if (!groupNameCn.trim() || !groupNameEn.trim() || !managerNameEn.trim()) {
      setCreateMsg('❌ All fields are required'); return
    }
    if (!userId) { setCreateMsg('❌ Not signed in — please sign in again'); return }
    setCreating(true); setCreateMsg('')
    try {
      const res = await fetch('/api/auth/create-group-for-self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId:   userId,
          groupNameCn:   groupNameCn.trim(),
          groupNameEn:   groupNameEn.trim(),
          managerNameEn: managerNameEn.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setCreateMsg(`❌ ${json.error || 'Creation failed'}`); return }
      window.location.href = `/${json.subdomain}/schedule`
    } catch {
      setCreateMsg('❌ Network error — please try again')
    } finally {
      setCreating(false)
    }
  }

  function handleSignOut() {
    document.cookie = 'qt_uid=; path=/; max-age=0'
    document.cookie = 'qt_auth=; path=/; max-age=0'
    document.cookie = 'qt_group=; path=/; max-age=0'
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">

        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-teal-600/20 border border-teal-500/30 mb-6">
          <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          </svg>
        </div>

        <h1 className="text-white mb-1"><BrandName /></h1>

        {!showCreate ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mt-6 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 border border-amber-200 mx-auto">
              <span className="text-xl">⏳</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Account active — no workspace yet</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Create a workspace to get started with your schedule.
            </p>

            <button
              onClick={() => setShowCreate(true)}
              className="w-full py-2.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
            >
              Create my workspace →
            </button>

            <button
              onClick={handleSignOut}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mt-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Create my workspace</h2>
            <p className="text-sm text-gray-500">You&apos;ll be the admin and can invite members.</p>

            <div className="space-y-3 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace name <span className="text-red-500">*</span></label>
                <input type="text" value={groupNameCn} onChange={e => setGroupNameCn(e.target.value)}
                  placeholder="e.g. My Law Firm"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace name (English) <span className="text-red-500">*</span></label>
                <input type="text" value={groupNameEn} onChange={e => setGroupNameEn(e.target.value)}
                  placeholder="e.g. MyLawFirm"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your name in English <span className="text-red-500">*</span></label>
                <input type="text" value={managerNameEn} onChange={e => setManagerNameEn(e.target.value)}
                  placeholder="e.g. JohnSmith"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-gray-400" />
              </div>

              {previewSubdomain && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5 text-xs text-gray-600">
                  Workspace URL: <span className="font-mono font-semibold text-teal-700">nanoschedule.com/{previewSubdomain}</span>
                </div>
              )}
            </div>

            {createMsg && <p className="text-sm text-red-600 text-left">{createMsg}</p>}

            <button onClick={handleCreate} disabled={creating}
              className="w-full py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 rounded-lg transition-colors">
              {creating ? 'Creating…' : 'Create workspace'}
            </button>
            <button onClick={() => { setShowCreate(false); setCreateMsg('') }}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
