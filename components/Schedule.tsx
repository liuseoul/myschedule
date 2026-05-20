'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useE2E } from '@/lib/useE2E'
import { useGroupKey } from '@/lib/useGroupKey'
import { encField, decField } from '@/lib/e2e'

const TYPE_LABELS: Record<string, string> = {
  court_hearing:          'Court Hearing',
  filing_deadline:        'Filing Deadline',
  consultation:           'Legal Consultation',
  statute_of_limitations: 'Limitation Period',
  online_meeting:         'Online Meeting',
  visiting:               'Client Visit',
  business_travel:        'Business Trip',
  personal_leave:         'Day Off',
  visiting_reception:     'Meet Client',
  others:                 'Other',
}

const TYPE_COLORS: Record<string, string> = {
  court_hearing:          'bg-red-100 text-red-700',
  filing_deadline:        'bg-rose-100 text-rose-700',
  consultation:           'bg-teal-100 text-teal-700',
  statute_of_limitations: 'bg-pink-100 text-pink-800',
  online_meeting:         'bg-blue-100 text-blue-700',
  visiting:               'bg-purple-100 text-purple-700',
  business_travel:        'bg-orange-100 text-orange-700',
  personal_leave:         'bg-yellow-100 text-yellow-700',
  visiting_reception:     'bg-green-100 text-green-700',
  others:                 'bg-gray-100 text-gray-600',
}

// Background colors for calendar day cells
const TYPE_BG: Record<string, string> = {
  court_hearing:          'bg-red-200',
  filing_deadline:        'bg-rose-200',
  consultation:           'bg-teal-200',
  statute_of_limitations: 'bg-pink-200',
  online_meeting:         'bg-blue-200',
  visiting:               'bg-purple-200',
  business_travel:        'bg-orange-200',
  personal_leave:         'bg-yellow-200',
  visiting_reception:     'bg-green-200',
  others:                 'bg-gray-200',
}

// Priority order for picking dominant color when multiple event types on same day
const TYPE_PRIORITY = [
  'court_hearing','filing_deadline','statute_of_limitations',
  'online_meeting','consultation','visiting',
  'business_travel','visiting_reception','personal_leave','others',
]

const ROW_BG    = ['bg-sky-50', 'bg-blue-50']
const MAX_UPCOMING = 20
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ── Official public holidays: China & South Korea ─────────────
// type 'off'  = public holiday / non-working day
// type 'work' = CN compensatory work day (调休上班 — weekend becomes a work day)
const HOLIDAYS: Record<string, { label: string; type: 'off' | 'work' }> = {
  // ══ 2025 ══════════════════════════════════════════════════════
  '2025-01-01': { label: "New Year's Day",                      type: 'off'  },
  '2025-01-26': { label: 'Comp. work day (Spring Festival)',    type: 'work' },
  '2025-01-28': { label: 'Spring Festival · Seollal Eve',       type: 'off'  },
  '2025-01-29': { label: 'Spring Festival · Seollal',           type: 'off'  },
  '2025-01-30': { label: 'Spring Festival · Seollal',           type: 'off'  },
  '2025-01-31': { label: 'Spring Festival',                     type: 'off'  },
  '2025-02-01': { label: 'Spring Festival',                     type: 'off'  },
  '2025-02-02': { label: 'Spring Festival',                     type: 'off'  },
  '2025-02-03': { label: 'Spring Festival',                     type: 'off'  },
  '2025-02-04': { label: 'Spring Festival',                     type: 'off'  },
  '2025-02-08': { label: 'Comp. work day (Spring Festival)',    type: 'work' },
  '2025-03-01': { label: 'Independence Movement Day',           type: 'off'  },
  '2025-03-03': { label: 'Independence Movement Day (sub.)',     type: 'off'  },
  '2025-04-04': { label: 'Qingming Festival',                   type: 'off'  },
  '2025-04-05': { label: 'Qingming Festival',                   type: 'off'  },
  '2025-04-06': { label: 'Qingming Festival',                   type: 'off'  },
  '2025-04-27': { label: 'Comp. work day (Labour Day)',         type: 'work' },
  '2025-05-01': { label: 'Labour Day',                          type: 'off'  },
  '2025-05-02': { label: 'Labour Day',                          type: 'off'  },
  '2025-05-03': { label: 'Labour Day',                          type: 'off'  },
  '2025-05-04': { label: 'Labour Day',                          type: 'off'  },
  '2025-05-05': { label: "Labour Day · Children's Day",         type: 'off'  },
  '2025-05-06': { label: "Buddha's Birthday (sub.)",            type: 'off'  },
  '2025-05-10': { label: 'Comp. work day (Labour Day)',         type: 'work' },
  '2025-05-31': { label: 'Dragon Boat Festival',                type: 'off'  },
  '2025-06-01': { label: 'Dragon Boat Festival',                type: 'off'  },
  '2025-06-02': { label: 'Dragon Boat Festival',                type: 'off'  },
  '2025-06-06': { label: 'Memorial Day',                        type: 'off'  },
  '2025-08-15': { label: 'Liberation Day',                      type: 'off'  },
  '2025-09-28': { label: 'Comp. work day (National Day)',       type: 'work' },
  '2025-10-01': { label: 'National Day',                        type: 'off'  },
  '2025-10-02': { label: 'National Day',                        type: 'off'  },
  '2025-10-03': { label: 'National Day · National Foundation Day', type: 'off' },
  '2025-10-04': { label: 'National Day',                        type: 'off'  },
  '2025-10-05': { label: 'National Day · Chuseok Eve',          type: 'off'  },
  '2025-10-06': { label: 'National Day · Mid-Autumn · Chuseok', type: 'off'  },
  '2025-10-07': { label: 'National Day · Chuseok',              type: 'off'  },
  '2025-10-08': { label: 'National Day · Chuseok (sub.)',        type: 'off'  },
  '2025-10-09': { label: 'Hangul Day',                          type: 'off'  },
  '2025-10-11': { label: 'Comp. work day (National Day)',       type: 'work' },
  '2025-12-25': { label: 'Christmas',                           type: 'off'  },
  // ══ 2026 ══════════════════════════════════════════════════════
  '2026-01-01': { label: "New Year's Day",                      type: 'off'  },
  '2026-02-15': { label: 'Spring Festival Eve',                 type: 'off'  },
  '2026-02-16': { label: 'Spring Festival · Seollal Eve',       type: 'off'  },
  '2026-02-17': { label: 'Spring Festival · Seollal',           type: 'off'  },
  '2026-02-18': { label: 'Spring Festival · Seollal',           type: 'off'  },
  '2026-02-19': { label: 'Spring Festival',                     type: 'off'  },
  '2026-02-20': { label: 'Spring Festival',                     type: 'off'  },
  '2026-02-21': { label: 'Spring Festival',                     type: 'off'  },
  '2026-02-22': { label: 'Spring Festival',                     type: 'off'  },
  '2026-02-23': { label: 'Spring Festival',                     type: 'off'  },
  '2026-03-01': { label: 'Independence Movement Day',           type: 'off'  },
  '2026-03-02': { label: 'Independence Movement Day (sub.)',     type: 'off'  },
  '2026-04-05': { label: 'Qingming Festival',                   type: 'off'  },
  '2026-04-06': { label: 'Qingming Festival',                   type: 'off'  },
  '2026-04-07': { label: 'Qingming Festival',                   type: 'off'  },
  '2026-05-01': { label: 'Labour Day',                          type: 'off'  },
  '2026-05-02': { label: 'Labour Day',                          type: 'off'  },
  '2026-05-03': { label: 'Labour Day',                          type: 'off'  },
  '2026-05-04': { label: 'Labour Day',                          type: 'off'  },
  '2026-05-05': { label: "Labour Day · Children's Day",         type: 'off'  },
  '2026-05-24': { label: "Buddha's Birthday",                   type: 'off'  },
  '2026-05-25': { label: "Buddha's Birthday (sub.)",            type: 'off'  },
  '2026-06-06': { label: 'Memorial Day',                        type: 'off'  },
  '2026-06-19': { label: 'Dragon Boat Festival',                type: 'off'  },
  '2026-06-20': { label: 'Dragon Boat Festival',                type: 'off'  },
  '2026-06-21': { label: 'Dragon Boat Festival',                type: 'off'  },
  '2026-08-15': { label: 'Liberation Day',                      type: 'off'  },
  '2026-08-17': { label: 'Liberation Day (sub.)',                type: 'off'  },
  '2026-09-23': { label: 'Chuseok Eve',                         type: 'off'  },
  '2026-09-24': { label: 'Mid-Autumn · Chuseok Eve',            type: 'off'  },
  '2026-09-25': { label: 'Mid-Autumn · Chuseok',               type: 'off'  },
  '2026-09-26': { label: 'Mid-Autumn · Chuseok',               type: 'off'  },
  '2026-09-28': { label: 'Chuseok (sub.)',                      type: 'off'  },
  '2026-10-01': { label: 'National Day',                        type: 'off'  },
  '2026-10-02': { label: 'National Day',                        type: 'off'  },
  '2026-10-03': { label: 'National Day · National Foundation Day', type: 'off' },
  '2026-10-04': { label: 'National Day',                        type: 'off'  },
  '2026-10-05': { label: 'National Day · Foundation Day (sub.)', type: 'off' },
  '2026-10-06': { label: 'National Day',                        type: 'off'  },
  '2026-10-07': { label: 'National Day',                        type: 'off'  },
  '2026-10-09': { label: 'Hangul Day',                          type: 'off'  },
  '2026-12-25': { label: 'Christmas',                           type: 'off'  },
}

type Member   = { id: string; name: string }
type Reminder = {
  id: string
  due_date: string
  start_date: string | null
  end_date: string | null
  content: string
  type: string
  start_time: string | null
  end_time: string | null
  created_by: string
  created_at: string
  deleted: boolean
  deleted_by: string | null
  deleted_by_name: string | null
  deleted_at: string | null
  assigned_to_name: string | null
  pre_alert_days: number[]
}
type GroupInfo = { id: string; name: string }

interface ScheduleProps {
  profile: { id: string; name: string; role: string } | null
  groupId: string
  groupName: string
  subdomain: string
}

function fmtTime(t: string | null) { return t ? t.slice(0, 5) : '' }
function remPrimaryDate(r: Reminder) { return r.start_date || r.due_date }
function remEndDate(r: Reminder)     { return r.end_date || r.start_date || r.due_date }

function remDateLabel(r: Reminder) {
  const sd = remPrimaryDate(r), ed = remEndDate(r)
  const sl = sd.slice(5, 7) + '/' + sd.slice(8, 10)
  return sd === ed ? sl : sl + '–' + ed.slice(5, 7) + '/' + ed.slice(8, 10)
}

function remFullDateLabel(r: Reminder, today: string) {
  const sd = remPrimaryDate(r), ed = remEndDate(r)
  const fmt = (s: string) => `${s.slice(0,4)}/${s.slice(5,7)}/${s.slice(8,10)}`
  return sd === ed ? (sd === today ? 'Today · ' : '') + fmt(sd) : fmt(sd) + ' – ' + fmt(ed)
}

export default function Schedule({ profile, groupId, groupName, subdomain }: ScheduleProps) {
  const router   = useRouter()
  const supabase = createClient()

  const { keyPair } = useE2E(profile?.id || null)
  const groupKey = useGroupKey(profile?.id || null, groupId, keyPair)

  const isAdmin  = ['first_admin', 'second_admin'].includes(profile?.role || '')

  function getLocalDateStr() {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`
  }
  const [todayStr, setTodayStr] = useState(getLocalDateStr)
  useEffect(() => {
    const id = setInterval(() => setTodayStr(getLocalDateStr()), 60_000)
    return () => clearInterval(id)
  }, [])

  const [currentUserId,    setCurrentUserId]    = useState<string | null>(null)
  const [reminders,        setReminders]        = useState<Reminder[]>([])
  const [displayReminders, setDisplayReminders] = useState<Reminder[]>([])
  const [members,          setMembers]          = useState<Member[]>([])
  const [myGroups,         setMyGroups]         = useState<GroupInfo[]>([])
  const [showGroupPicker,  setShowGroupPicker]  = useState(false)
  const [showAllUpcoming,  setShowAllUpcoming]  = useState(false)
  const [showAllRem,       setShowAllRem]       = useState(false)
  const [showCourtDates,   setShowCourtDates]   = useState(true)
  const [showPastModal,    setShowPastModal]    = useState(false)

  // ── Calendar state ────────────────────────────────────────
  const now = new Date()
  const [calYear,      setCalYear]      = useState(now.getFullYear())
  const [calMonth,     setCalMonth]     = useState(now.getMonth())
  const [calFocusDate, setCalFocusDate] = useState<string | null>(null)

  // ── Add reminder form ─────────────────────────────────────
  const [showAddRem,   setShowAddRem]   = useState(false)
  const [remStartDate, setRemStartDate] = useState(todayStr)
  const [remEndDate_,  setRemEndDate_]  = useState(todayStr)
  const [remStartTime, setRemStartTime] = useState('')
  const [remEndTime,   setRemEndTime]   = useState('')
  const [remContent,   setRemContent]   = useState('')
  const [remPreAlerts, setRemPreAlerts] = useState<number[]>([])
  const [remSaving,    setRemSaving]    = useState(false)

  // ── Detail / edit modal ───────────────────────────────────
  const [selectedRem,    setSelectedRem]   = useState<Reminder | null>(null)
  const [detailMode,     setDetailMode]    = useState<'view' | 'edit'>('view')
  const [editType,       setEditType]      = useState('others')
  const [editStartDate,  setEditStartDate] = useState(todayStr)
  const [editEndDate_,   setEditEndDate_]  = useState(todayStr)
  const [editStartTime,  setEditStartTime] = useState('')
  const [editEndTime,    setEditEndTime]   = useState('')
  const [editContent,    setEditContent]   = useState('')
  const [editAssigned,   setEditAssigned]  = useState('')
  const [editPreAlerts,  setEditPreAlerts] = useState<number[]>([])
  const [editSaving,     setEditSaving]    = useState(false)

  useEffect(() => {
    const uid = profile?.id || null
    setCurrentUserId(uid)
    if (uid) loadMyGroups(uid)
    loadReminders()
    loadMembers()
  }, [groupId])

  useEffect(() => {
    setDisplayReminders(reminders.map(r => ({ ...r, content: decField(r.content, groupKey) || r.content })))
  }, [reminders, groupKey])

  async function loadReminders() {
    const { data, error } = await supabase
      .from('reminders').select('*')
      .eq('group_id', groupId).order('due_date', { ascending: true })
    if (!error) setReminders(data || [])
  }

  async function loadMembers() {
    const { data } = await supabase
      .from('group_members').select('profiles(id, name)').eq('group_id', groupId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMembers((data || []).map((m: any) => ({ id: m.profiles?.id || '', name: m.profiles?.name || '' })).filter(m => m.id))
  }

  async function loadMyGroups(userId: string) {
    const { data } = await supabase
      .from('group_members').select('groups(id, name)').eq('user_id', userId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMyGroups((data || []).map((m: any) => ({ id: m.groups?.id || '', name: m.groups?.name || '' })).filter(g => g.id))
  }

  async function switchGroup(gid: string) {
    document.cookie = `qt_group=${gid}; path=/; max-age=86400; SameSite=Lax`
    setShowGroupPicker(false)
    const { data: grp } = await supabase.from('groups').select('subdomain').eq('id', gid).single()
    if (grp?.subdomain) router.push(`/${grp.subdomain}/schedule`)
    else router.push('/')
    router.refresh()
  }

  // ── Reminder partitions ───────────────────────────────────
  const upcoming = displayReminders
    .filter(r => !r.deleted && remEndDate(r) >= todayStr)
    .sort((a, b) => remPrimaryDate(a).localeCompare(remPrimaryDate(b)))
  const past = displayReminders
    .filter(r => !r.deleted && remEndDate(r) < todayStr)
    .sort((a, b) => remPrimaryDate(b).localeCompare(remPrimaryDate(a)))
  const deletedRems = displayReminders
    .filter(r => r.deleted)
    .sort((a, b) => (b.deleted_at ?? remPrimaryDate(b)).localeCompare(a.deleted_at ?? remPrimaryDate(a)))

  const visibleUpcoming = showAllUpcoming ? upcoming : upcoming.slice(0, MAX_UPCOMING)
  const hasMoreUpcoming = !showAllUpcoming && upcoming.length > MAX_UPCOMING

  // ── Save new reminder ────────────────────────────────────
  async function saveReminder() {
    if (!remStartDate || !remEndDate_ || !remContent.trim()) { alert('Please fill in date and notes'); return }
    if (remEndDate_ < remStartDate) { alert('End date cannot be before start date'); return }
    if (remEndTime && remStartTime && remEndTime <= remStartTime) { alert('End time must be after start time'); return }
    setRemSaving(true)
    const { error } = await supabase.from('reminders').insert({
      due_date: remStartDate, start_date: remStartDate, end_date: remEndDate_,
      content: encField(remContent.trim(), groupKey) ?? remContent.trim(),
      type: 'others',
      start_time: remStartTime || null, end_time: remEndTime || null,
      assigned_to_name: null, pre_alert_days: remPreAlerts,
      group_id: groupId, created_by: profile!.id,
    })
    if (error) { alert('Save failed: ' + error.message) }
    else { setShowAddRem(false); resetAddForm(); await loadReminders() }
    setRemSaving(false)
  }

  function resetAddForm() {
    setRemContent(''); setRemStartDate(todayStr); setRemEndDate_(todayStr)
    setRemStartTime(''); setRemEndTime(''); setRemPreAlerts([])
  }

  function openDetailRem(r: Reminder) { setSelectedRem(r); setDetailMode('view') }
  function closeDetailRem()           { setSelectedRem(null); setDetailMode('view') }

  function startEditRem(r: Reminder) {
    setEditType(r.type || 'others')
    setEditStartDate(r.start_date || r.due_date)
    setEditEndDate_(r.end_date || r.start_date || r.due_date)
    setEditStartTime(r.start_time || '')
    setEditEndTime(r.end_time || '')
    setEditContent(r.content)
    setEditAssigned(r.assigned_to_name || '')
    setEditPreAlerts(r.pre_alert_days || [])
    setDetailMode('edit')
  }

  async function saveEditRem() {
    if (!editStartDate || !editEndDate_ || !editContent.trim()) { alert('Please fill in all required fields'); return }
    if (editEndDate_ < editStartDate) { alert('End date cannot be before start date'); return }
    if (editEndTime && editStartTime && editEndTime <= editStartTime) { alert('End time must be after start time'); return }
    setEditSaving(true)
    const { error } = await supabase.from('reminders').update({
      due_date: editStartDate, start_date: editStartDate, end_date: editEndDate_,
      content: encField(editContent.trim(), groupKey) ?? editContent.trim(), type: editType,
      start_time: editStartTime || null, end_time: editEndTime || null,
      assigned_to_name: editAssigned || null, pre_alert_days: editPreAlerts,
    }).eq('id', selectedRem!.id).eq('group_id', groupId)
    setEditSaving(false)
    if (error) { alert('Save failed: ' + error.message); return }
    closeDetailRem(); await loadReminders()
  }

  async function softDeleteReminder(id: string) {
    if (!confirm('Delete this event? It will still be visible in history.')) return
    const { data: prof } = await supabase.from('profiles').select('name').eq('id', profile!.id).single()
    const { error } = await supabase.from('reminders').update({
      deleted: true, deleted_by: profile!.id,
      deleted_by_name: prof?.name || 'Unknown', deleted_at: new Date().toISOString(),
    }).eq('id', id).eq('group_id', groupId)
    if (error) { alert('Delete failed: ' + error.message); return }
    closeDetailRem(); await loadReminders()
  }

  async function restoreReminder(id: string) {
    const { error } = await supabase.from('reminders').update({
      deleted: false, deleted_by: null, deleted_by_name: null, deleted_at: null,
    }).eq('id', id).eq('group_id', groupId)
    if (error) { alert('Restore failed: ' + error.message); return }
    closeDetailRem(); await loadReminders()
  }

  async function hardDeleteReminder(id: string) {
    if (!confirm('Permanently delete? This cannot be undone.')) return
    const { error } = await supabase.from('reminders').delete().eq('id', id).eq('group_id', groupId)
    if (error) { alert('Delete failed: ' + error.message); return }
    closeDetailRem(); await loadReminders()
  }

  function handleLogout() {
    document.cookie = 'qt_uid=; path=/; max-age=0'
    document.cookie = 'qt_auth=; path=/; max-age=0'
    document.cookie = 'qt_group=; path=/; max-age=0'
    router.push('/login')
    router.refresh()
  }

  // ── Calendar helpers ──────────────────────────────────────
  function eventsOnDay(dayStr: string): Reminder[] {
    return displayReminders.filter(r =>
      !r.deleted &&
      remPrimaryDate(r) <= dayStr &&
      remEndDate(r) >= dayStr
    )
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  // ── Inner helpers ─────────────────────────────────────────
  function TypeGrid({ current, onSet }: { current: string; onSet: (v: string) => void }) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(TYPE_LABELS).map(([val, label]) => (
          <button key={val} type="button" onClick={() => onSet(val)}
            className={`py-1.5 px-3 text-sm rounded-lg border transition-colors text-left
              ${current === val ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>
    )
  }

  function MemberSelector({ current, onSet }: { current: string; onSet: (v: string) => void }) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => onSet('')}
          className={`text-xs px-2 py-1 rounded border transition-colors
            ${current === '' ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
          Unassigned
        </button>
        {members.map(m => (
          <button key={m.id} type="button" onClick={() => onSet(m.name)}
            className={`text-xs px-2 py-1 rounded border transition-colors
              ${current === m.name ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            {m.name}
          </button>
        ))}
      </div>
    )
  }

  function TimeSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
    const MINS = [0, 15, 30, 45]
    const parts  = value ? value.split(':') : []
    const curH   = parts[0] ? parseInt(parts[0]) : -1
    const curM   = parts[1] ? parseInt(parts[1]) : -1
    function set(h: number, m: number) {
      onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="flex items-center gap-1">
          <select value={curH >= 0 ? curH : ''}
            onChange={e => e.target.value === '' ? onChange('') : set(parseInt(e.target.value), curM >= 0 ? curM : 0)}
            className="input-field flex-1 pr-1">
            <option value="">--</option>
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
            ))}
          </select>
          <span className="text-gray-400 font-bold">:</span>
          <select value={curM >= 0 ? curM : ''}
            onChange={e => e.target.value === '' ? onChange('') : set(curH >= 0 ? curH : 9, parseInt(e.target.value))}
            className="input-field flex-1 pr-1">
            <option value="">--</option>
            {MINS.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
          </select>
          {value && (
            <button type="button" onClick={() => onChange('')}
              className="text-gray-400 hover:text-gray-600 text-sm px-1">✕</button>
          )}
        </div>
      </div>
    )
  }

  function DateTimeFields({
    startDate, endDate, startTime, endTime,
    onStartDate, onEndDate, onStartTime, onEndTime,
  }: {
    startDate: string; endDate: string; startTime: string; endTime: string
    onStartDate: (v: string) => void; onEndDate: (v: string) => void
    onStartTime: (v: string) => void; onEndTime:  (v: string) => void
  }) {
    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date <span className="text-red-500">*</span></label>
            <input type="date" value={startDate}
              onChange={e => { onStartDate(e.target.value); if (endDate < e.target.value) onEndDate(e.target.value) }}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End date <span className="text-red-500">*</span></label>
            <input type="date" value={endDate} min={startDate} onChange={e => onEndDate(e.target.value)} className="input-field" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TimeSelect value={startTime} onChange={onStartTime} label="Start time" />
          <TimeSelect value={endTime}   onChange={onEndTime}   label="End time" />
        </div>
      </>
    )
  }

  function ReminderRow({ r, index, variant }: { r: Reminder; index: number; variant: 'upcoming' | 'past' | 'deleted' }) {
    const primDate  = remPrimaryDate(r)
    const isToday   = primDate === todayStr
    const dateLabel = remDateLabel(r)
    const rowBg     = variant === 'upcoming' ? (isToday ? '' : ROW_BG[index % 2]) : ''
    const cls =
      variant === 'upcoming' && isToday ? 'bg-amber-200 border-amber-400'
      : variant === 'upcoming'          ? `${rowBg} border-gray-200`
      : variant === 'past'              ? 'bg-gray-50 border-gray-200 opacity-70'
      : 'bg-red-50/40 border-gray-200 opacity-60'
    return (
      <button onClick={() => openDetailRem(r)}
        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 hover:border-teal-400 hover:shadow-sm ${cls}`}>
        <div className="flex flex-col items-center flex-shrink-0 bg-yellow-300 border-2 border-black rounded-lg px-2 py-1 min-w-[56px]">
          <span className={`text-sm font-bold leading-tight whitespace-nowrap
            ${variant === 'upcoming' && isToday ? 'text-amber-800' : variant === 'upcoming' ? 'text-gray-900' : 'text-gray-500'}`}>
            {dateLabel}
          </span>
          {r.start_time && (
            <span className="text-xs text-gray-500 leading-tight mt-0.5">
              {fmtTime(r.start_time)}{r.end_time ? `–${fmtTime(r.end_time)}` : ''}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className={`text-lg leading-snug
            ${variant === 'deleted' ? 'line-through text-gray-400'
            : variant === 'past'    ? 'line-through text-gray-500'
            : isToday               ? 'text-amber-900 font-bold'
            : 'text-gray-800'}`}>
            {r.content}
          </span>
          {variant === 'upcoming' && r.type && r.type !== 'others' && (
            <span className={`ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded align-middle ${TYPE_COLORS[r.type] || TYPE_COLORS.others}`}>
              {TYPE_LABELS[r.type] || r.type}
            </span>
          )}
          {variant === 'upcoming' && r.assigned_to_name && (
            <span className="ml-1.5 text-xs text-indigo-500 font-medium align-middle">@{r.assigned_to_name}</span>
          )}
          {variant === 'past'    && <span className="ml-1.5 text-xs text-gray-400 align-middle">Past</span>}
          {variant === 'deleted' && r.deleted_by_name && (
            <span className="ml-1.5 text-xs text-red-400 align-middle">Deleted · {r.deleted_by_name}</span>
          )}
        </div>
      </button>
    )
  }

  // ── Month calendar ────────────────────────────────────────
  function MonthCalendar() {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    // Week starts Monday: getDay() returns 0=Sun→6, 1=Mon→0, …
    const rawDow = new Date(calYear, calMonth, 1).getDay()
    const firstDow = (rawDow + 6) % 7

    const cells: (number | null)[] = []
    for (let i = 0; i < firstDow; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    const dayData: { dayStr: string; events: Reminder[]; topType: string | null }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const events = eventsOnDay(dayStr)
      const types  = events.map(r => r.type || 'others')
      const topType = TYPE_PRIORITY.find(t => types.includes(t)) ?? null
      dayData.push({ dayStr, events, topType })
    }

    return (
      <div className="bg-sky-50 rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors text-2xl leading-none font-bold">‹</button>
          <span className="text-xl font-bold text-gray-800">{MONTH_NAMES[calMonth]} {calYear}</span>
          <button onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors text-2xl leading-none font-bold">›</button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 text-center">
          {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
            <div key={d} className="text-sm font-bold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const { dayStr, events } = dayData[day - 1]
            const isToday      = dayStr === todayStr
            const isPast       = dayStr < todayStr
            const hasEvents    = events.length > 0
            const showMark     = hasEvents && !isPast
            const holiday      = HOLIDAYS[dayStr]
            const isOffDay     = holiday?.type === 'off'
            const isWorkDay    = holiday?.type === 'work'
            const isClickable  = hasEvents || !!holiday

            const bgClass = isToday
              ? 'bg-teal-500 text-white ring-2 ring-teal-600'
              : showMark
                ? 'bg-yellow-300 border-2 border-black text-gray-900 hover:bg-yellow-400'
                : isClickable
                  ? 'hover:bg-blue-50 text-gray-700'
                  : 'hover:bg-gray-100 text-gray-700'

            return (
              <button
                key={i}
                onClick={() => isClickable ? setCalFocusDate(dayStr) : undefined}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-lg font-bold transition-all
                  ${bgClass} ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {/* Handwriting-style circle for holiday/rest days — bright blue */}
                {isOffDay && !isToday && (
                  <svg viewBox="0 0 40 40" fill="none"
                    className="absolute inset-0 w-full h-full pointer-events-none">
                    <path
                      d="M20 5 C28 4,37 10,36 20 C35 30,27 37,18 37 C9 37,2 29,4 20 C6 10,13 4,20 5"
                      stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" fill="none"
                    />
                  </svg>
                )}
                {/* Compensatory work day — small orange W badge */}
                {isWorkDay && (
                  <span className="absolute top-0.5 right-1 text-[9px] font-bold text-orange-500 leading-none">W</span>
                )}
                <span>{day}</span>
                {showMark && events.length > 1 && (
                  <span className={`text-xs font-bold leading-none mt-0.5 ${isToday ? 'text-teal-100' : 'text-gray-500'}`}>
                    {events.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Color legend */}
        {(() => {
          const typesThisMonth = new Set<string>()
          dayData.forEach(({ events }) => events.forEach(r => typesThisMonth.add(r.type || 'others')))
          if (typesThisMonth.size === 0) return null
          return (
            <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-x-3 gap-y-1.5">
              {Array.from(typesThisMonth).filter(t => t !== 'others').map(t => (
                <div key={t} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${TYPE_BG[t] || 'bg-gray-200'}`} />
                  <span className="text-[10px] text-gray-500">{TYPE_LABELS[t] || t}</span>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    )
  }

  // Events for the focused calendar date
  const focusDateEvents = calFocusDate ? eventsOnDay(calFocusDate) : []

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-bold text-sm px-3 py-1 bg-green-500 border-2 border-black rounded-full text-white">MySchedule</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {myGroups.length > 1 && (
                <button onClick={() => setShowGroupPicker(true)}
                  className="text-xs px-2.5 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                  Switch
                </button>
              )}
              <span className="text-sm text-gray-600 hidden sm:block">{profile?.name || ''}</span>

              <button onClick={handleLogout}
                className="font-bold text-sm px-3 py-1 bg-green-500 border-2 border-black rounded-full text-white hover:bg-green-600 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* ── Two-column main ─────────────────────────────────── */}
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 flex flex-col lg:flex-row gap-4 min-h-0">

          {/* Left on desktop, top on mobile: calendar */}
          <div className="lg:w-[480px] xl:w-[540px] flex-shrink-0">
            <MonthCalendar />
          </div>

          {/* Right on desktop, bottom on mobile: schedule list */}
          <div className="flex-1 flex flex-col min-h-0 lg:max-w-[520px]">
            <div className="flex items-center justify-between mb-3 flex-shrink-0 bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5">
              <span className="text-sm font-semibold text-gray-700">📅 Schedule</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowAllRem(true)}
                  className="text-xs text-gray-500 hover:text-teal-600 px-2.5 py-1 rounded-lg border border-gray-300 hover:border-teal-400 transition-colors">
                  All events
                </button>
                <button onClick={() => setShowAddRem(true)}
                  className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium px-3 py-1 rounded-lg transition-colors">
                  + Add event
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pb-4">
              {/* Pre-alerts */}
              {(() => {
                const preAlerts = upcoming.filter(r => {
                  if (!r.pre_alert_days || r.pre_alert_days.length === 0) return false
                  const d = Math.ceil((new Date(remPrimaryDate(r)).getTime() - new Date(todayStr).getTime()) / 86400000)
                  return r.pre_alert_days.includes(d)
                })
                if (preAlerts.length === 0) return null
                return (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 pb-1">
                      <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">⚡ Pre-alerts</span>
                    </div>
                    <div className="space-y-1">
                      {preAlerts.map(r => {
                        const d = Math.ceil((new Date(remPrimaryDate(r)).getTime() - new Date(todayStr).getTime()) / 86400000)
                        return (
                          <button key={r.id} onClick={() => openDetailRem(r)}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors">
                            <span className="text-[10px] font-bold text-orange-700 min-w-10">⚡ {d}d</span>
                            <span className="text-xs text-orange-800 truncate">{r.content}</span>
                          </button>
                        )
                      })}
                    </div>
                    <div className="h-px bg-gray-200 mt-3" />
                  </div>
                )
              })()}

              {/* Court dates */}
              {(() => {
                const courtTypes = ['court_hearing', 'filing_deadline']
                const cutoff = new Date(todayStr)
                cutoff.setDate(cutoff.getDate() + 14)
                const cutoffStr = cutoff.toISOString().slice(0, 10)
                const courtDates = upcoming.filter(r => courtTypes.includes(r.type) && remPrimaryDate(r) <= cutoffStr)
                if (courtDates.length === 0) return null
                return (
                  <div className="mb-3">
                    <button onClick={() => setShowCourtDates(v => !v)} className="flex items-center gap-1 pb-1 w-full">
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">⚖️ Court Dates</span>
                      <span className="text-[10px] text-rose-400 ml-1">({courtDates.length})</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{showCourtDates ? '▲' : '▼'}</span>
                    </button>
                    {showCourtDates && (
                      <div className="space-y-1">
                        {courtDates.map(r => {
                          const primDate = remPrimaryDate(r)
                          const d = Math.ceil((new Date(primDate).getTime() - new Date(todayStr).getTime()) / 86400000)
                          const isUrgent = d <= 3
                          return (
                            <button key={r.id} onClick={() => openDetailRem(r)}
                              className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors
                                ${isUrgent ? 'border-rose-300 bg-rose-50 hover:bg-rose-100' : 'border-red-100 bg-red-50/50 hover:bg-red-50'}`}>
                              <span className={`text-[10px] font-bold min-w-8 ${isUrgent ? 'text-rose-700' : 'text-red-500'}`}>
                                {primDate.slice(5, 7)}/{primDate.slice(8, 10)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className={`text-xs truncate block ${isUrgent ? 'text-rose-800 font-medium' : 'text-red-700'}`}>{r.content}</span>
                                <span className={`text-[10px] ${TYPE_COLORS[r.type] || ''} px-1 rounded`}>{TYPE_LABELS[r.type]}</span>
                              </div>
                              <span className={`text-[10px] font-semibold flex-shrink-0 ${isUrgent ? 'text-rose-700' : 'text-red-400'}`}>
                                {d === 0 ? 'Today' : `${d}d`}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    <div className="h-px bg-gray-200 mt-3" />
                  </div>
                )
              })()}

              {visibleUpcoming.map((r, i) => <ReminderRow key={r.id} r={r} index={i} variant="upcoming" />)}
              {hasMoreUpcoming && (
                <button onClick={() => setShowAllUpcoming(true)}
                  className="w-full py-2 text-xs text-gray-500 hover:text-teal-600 border border-dashed border-gray-300 hover:border-teal-400 rounded-lg transition-colors">
                  Show more ({upcoming.length - MAX_UPCOMING} more)
                </button>
              )}
              {showAllUpcoming && upcoming.length > MAX_UPCOMING && (
                <button onClick={() => setShowAllUpcoming(false)}
                  className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 rounded-lg transition-colors">
                  Collapse
                </button>
              )}

              {(past.length > 0 || deletedRems.length > 0) && (
                <button onClick={() => setShowPastModal(true)}
                  className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-teal-600 border border-dashed border-gray-300 hover:border-teal-400 rounded-lg transition-colors">
                  See past ({past.length + deletedRems.length})
                </button>
              )}

              {displayReminders.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm mb-2">No events yet</p>
                  <button onClick={() => setShowAddRem(true)} className="text-teal-600 hover:text-teal-800 text-sm font-medium">
                    + Add your first event
                  </button>
                </div>
              )}
            </div>
          </div>

        </main>
      </div>

      {/* ══ Calendar date popup ══════════════════════════════════ */}
      {calFocusDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setCalFocusDate(null)}>
          <div className="bg-yellow-50 rounded-2xl shadow-2xl w-full max-w-sm max-h-[70vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-200 flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900">
                {calFocusDate.slice(0,4)}/{calFocusDate.slice(5,7)}/{calFocusDate.slice(8,10)}
                {calFocusDate === todayStr && <span className="ml-2 text-xs text-amber-600 font-medium">Today</span>}
              </h3>
              <button onClick={() => setCalFocusDate(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {/* Holiday info */}
              {HOLIDAYS[calFocusDate] && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  HOLIDAYS[calFocusDate].type === 'off'
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'bg-orange-50 border border-orange-200 text-orange-700'
                }`}>
                  <span>{HOLIDAYS[calFocusDate].type === 'off' ? '🔵' : '🟠'}</span>
                  <span>{HOLIDAYS[calFocusDate].label}</span>
                </div>
              )}
              {focusDateEvents.map(r => (
                <button key={r.id} onClick={() => { setCalFocusDate(null); openDetailRem(r) }}
                  className="w-full text-left px-4 py-3 rounded-xl border border-yellow-200 hover:border-teal-400 hover:bg-teal-50 transition-all">
                  <div className="flex items-start gap-2">
                    {r.type && r.type !== 'others' && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${TYPE_COLORS[r.type] || TYPE_COLORS.others}`}>
                        {TYPE_LABELS[r.type] || r.type}
                      </span>
                    )}
                    <span className="text-sm text-gray-800 leading-snug">{r.content}</span>
                  </div>
                  {r.start_time && (
                    <div className="text-xs text-gray-400 mt-1">
                      {fmtTime(r.start_time)}{r.end_time ? ` – ${fmtTime(r.end_time)}` : ''}
                    </div>
                  )}
                </button>
              ))}
              {focusDateEvents.length === 0 && !HOLIDAYS[calFocusDate] && (
                <p className="text-sm text-gray-400 text-center py-6">No events on this date</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ Switch Group Modal ══════════════════════════════════ */}
      {showGroupPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-yellow-50 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Switch workspace</h3>
              <button onClick={() => setShowGroupPicker(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="space-y-2">
              {myGroups.map(g => (
                <button key={g.id} onClick={() => switchGroup(g.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all
                    ${g.id === groupId ? 'border-teal-500 bg-teal-50 text-teal-700 font-semibold' : 'border-gray-200 hover:border-teal-400 text-gray-800 hover:bg-teal-50'}`}>
                  {g.name}
                  {g.id === groupId && <span className="ml-2 text-xs font-normal text-teal-500">Current</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ Add Reminder Modal ══════════════════════════════════ */}
      {showAddRem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-yellow-50 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900">Add event</h3>
              <button onClick={() => { setShowAddRem(false); resetAddForm() }} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <DateTimeFields
                startDate={remStartDate} endDate={remEndDate_}
                startTime={remStartTime} endTime={remEndTime}
                onStartDate={setRemStartDate} onEndDate={setRemEndDate_}
                onStartTime={setRemStartTime} onEndTime={setRemEndTime}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-red-500">*</span></label>
                <textarea value={remContent} onChange={e => setRemContent(e.target.value)}
                  placeholder="Event details…" rows={3} className="input-field resize-none" autoFocus />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <button onClick={() => { setShowAddRem(false); resetAddForm() }}
                className="flex-1 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={saveReminder} disabled={remSaving}
                className="flex-1 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:bg-gray-200 disabled:text-gray-400 transition-colors">
                {remSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Reminder Detail / Edit Modal ════════════════════════ */}
      {selectedRem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-yellow-50 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900">
                {detailMode === 'edit' ? 'Edit event' : 'Event details'}
              </h3>
              <button onClick={closeDetailRem} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            {detailMode === 'view' ? (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {selectedRem.deleted ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg">
                      <span className="text-xs text-red-500 font-semibold">Deleted</span>
                      {selectedRem.deleted_by_name && <span className="text-xs text-red-400">· By: {selectedRem.deleted_by_name}</span>}
                    </div>
                  ) : remEndDate(selectedRem) < todayStr ? (
                    <div className="px-3 py-1.5 bg-gray-100 rounded-lg">
                      <span className="text-xs text-gray-500 font-semibold">Past</span>
                    </div>
                  ) : null}
                  {!selectedRem.deleted && selectedRem.type && selectedRem.type !== 'others' && (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_COLORS[selectedRem.type] || TYPE_COLORS.others}`}>
                      {TYPE_LABELS[selectedRem.type] || selectedRem.type}
                    </span>
                  )}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold
                    ${remPrimaryDate(selectedRem) === todayStr ? 'bg-amber-100 text-amber-700'
                    : remEndDate(selectedRem) < todayStr || selectedRem.deleted ? 'bg-gray-100 text-gray-500'
                    : 'bg-teal-50 text-teal-700'}`}>
                    <span>📅</span><span>{remFullDateLabel(selectedRem, todayStr)}</span>
                  </div>
                  {selectedRem.start_time && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <span>🕐</span>
                      <span>{fmtTime(selectedRem.start_time)}{selectedRem.end_time ? ` – ${fmtTime(selectedRem.end_time)}` : ''}</span>
                    </div>
                  )}
                  {selectedRem.assigned_to_name && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <span>👤</span><span>{selectedRem.assigned_to_name}</span>
                    </div>
                  )}
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap
                    ${selectedRem.deleted || remEndDate(selectedRem) < todayStr ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {selectedRem.content}
                  </p>
                </div>
                <div className="flex gap-2 px-6 py-4 border-t border-gray-200 flex-shrink-0 flex-wrap">
                  <button onClick={closeDetailRem}
                    className="flex-1 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Close</button>
                  {!selectedRem.deleted && (
                    <button onClick={() => startEditRem(selectedRem)}
                      className="flex-1 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors">Edit</button>
                  )}
                  {!selectedRem.deleted && (
                    <button onClick={() => softDeleteReminder(selectedRem.id)}
                      className="flex-1 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">Delete</button>
                  )}
                  {selectedRem.deleted && (currentUserId === selectedRem.deleted_by || isAdmin) && (
                    <button onClick={() => restoreReminder(selectedRem.id)}
                      className="flex-1 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors">Restore</button>
                  )}
                  {selectedRem.deleted && isAdmin && (
                    <button onClick={() => hardDeleteReminder(selectedRem.id)}
                      className="flex-1 py-2 text-sm font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors">Delete permanently</button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  <DateTimeFields
                    startDate={editStartDate} endDate={editEndDate_}
                    startTime={editStartTime} endTime={editEndTime}
                    onStartDate={setEditStartDate} onEndDate={setEditEndDate_}
                    onStartTime={setEditStartTime} onEndTime={setEditEndTime}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-red-500">*</span></label>
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                      rows={3} className="input-field resize-none" />
                  </div>
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
                  <button onClick={() => setDetailMode('view')}
                    className="flex-1 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={saveEditRem} disabled={editSaving}
                    className="flex-1 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:bg-gray-200 disabled:text-gray-400 transition-colors">
                    {editSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ Past & Deleted Modal ════════════════════════════════ */}
      {showPastModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-yellow-50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900">
                Past &amp; deleted
                <span className="ml-2 text-gray-400 font-normal text-sm">({past.length + deletedRems.length})</span>
              </h3>
              <button onClick={() => setShowPastModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
              {past.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 pb-1">Past</p>
                  {past.map((r, i) => <ReminderRow key={r.id} r={r} index={i} variant="past" />)}
                </>
              )}
              {deletedRems.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 pb-1 pt-3">Deleted</p>
                  {deletedRems.map((r, i) => <ReminderRow key={r.id} r={r} index={i} variant="deleted" />)}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ All Events Modal ════════════════════════════════════ */}
      {showAllRem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-yellow-50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900">All events <span className="text-gray-400 font-normal text-sm">({upcoming.length})</span></h3>
              <button onClick={() => setShowAllRem(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {upcoming.map((r, i) => <ReminderRow key={r.id} r={r} index={i} variant="upcoming" />)}
              {upcoming.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No upcoming events</p>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
