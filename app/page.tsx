export const dynamic = 'force-dynamic'
export const runtime = 'edge'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export default async function RootPage() {
  const cookieStore = await cookies()
  let userId: string | null = cookieStore.get('qt_uid')?.value
    ? decodeURIComponent(cookieStore.get('qt_uid')!.value)
    : null
  if (!userId) {
    try {
      const { userId: clerkUserId } = await auth()
      userId = clerkUserId
    } catch {
      userId = null
    }
  }

  if (!userId) redirect('/login')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: membership } = await supabase
    .from('group_members')
    .select('group_id, groups(subdomain)')
    .eq('user_id', userId)
    .limit(1)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subdomain = (membership as any)?.groups?.subdomain
  if (subdomain) redirect(`/${subdomain}/schedule`)
  else redirect('/pending')
}
