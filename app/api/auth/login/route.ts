export const runtime = 'edge'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ADMIN_ID   = 'liu'
const ADMIN_PW   = 'ust321'
const ADMIN_CODE = '141014'

export async function POST(req: Request) {
  const { adminId, password, code } = await req.json()

  if (adminId !== ADMIN_ID || password !== ADMIN_PW || code !== ADMIN_CODE) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Ensure profile exists (ignore errors)
  await supabase.from('profiles')
    .upsert({ id: ADMIN_ID, name: 'Liu' }, { onConflict: 'id', ignoreDuplicates: true })

  // Look up existing group membership
  const { data: membership } = await supabase
    .from('group_members')
    .select('group_id, groups(subdomain)')
    .eq('user_id', ADMIN_ID)
    .limit(1)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let subdomain: string | null = (membership as any)?.groups?.subdomain ?? null

  if (!subdomain) {
    // Check if subdomain 'liu' already exists
    const { data: existing } = await supabase
      .from('groups').select('id, subdomain').eq('subdomain', ADMIN_ID).maybeSingle()

    let groupId: string | null = null
    if (existing) {
      groupId = existing.id
      subdomain = existing.subdomain
    } else {
      const { data: newGroup } = await supabase
        .from('groups')
        .insert({
          name:            'My Schedule',
          description:     'Admin workspace',
          firm_name_cn:    'My Schedule',
          firm_name_en:    'MySchedule',
          manager_name_cn: 'Liu',
          manager_name_en: 'Liu',
          subdomain:       ADMIN_ID,
        })
        .select('id, subdomain')
        .single()

      if (newGroup) {
        groupId = newGroup.id
        subdomain = newGroup.subdomain
      }
    }

    if (groupId) {
      await supabase.from('group_members').upsert(
        { group_id: groupId, user_id: ADMIN_ID, role: 'first_admin' },
        { onConflict: 'group_id,user_id', ignoreDuplicates: true }
      )
    }
  }

  // Credentials valid — return success (client sets cookies for reliability)
  return NextResponse.json({ ok: true, subdomain, userId: ADMIN_ID })
}
