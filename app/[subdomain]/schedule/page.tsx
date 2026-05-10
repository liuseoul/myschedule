export const dynamic = 'force-dynamic'
export const runtime = 'edge'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Schedule from '@/components/Schedule'

export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ _uid?: string }>
}) {
  const { subdomain } = await params
  const { _uid } = await searchParams

  const cookieStore = await cookies()
  let userId: string | null = _uid || null
  if (!userId) {
    userId = cookieStore.get('qt_uid')?.value
      ? decodeURIComponent(cookieStore.get('qt_uid')!.value)
      : null
  }
  if (!userId) redirect('/login')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: group } = await supabase
    .from('groups').select('id, name, subdomain').eq('subdomain', subdomain).single()
  if (!group) redirect('/login')

  const { data: membership } = await supabase
    .from('group_members').select('role')
    .eq('group_id', group.id).eq('user_id', userId).single()
  if (!membership) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('id, name').eq('id', userId).single()

  const effectiveProfile = { name: '', ...(profile || {}), id: userId, role: membership.role }

  return (
    <Schedule
      profile={effectiveProfile}
      groupId={group.id}
      groupName={group.name}
      subdomain={subdomain}
    />
  )
}
