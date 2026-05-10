export const runtime = 'edge'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { clerkUserId, name, email, affiliation } = body as {
    clerkUserId: string
    name: string
    email: string
    affiliation?: string
  }

  if (!clerkUserId || !name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase.from('profiles').upsert({
    id:          clerkUserId,
    name:        name.trim(),
    email:       email.trim().toLowerCase(),
    affiliation: affiliation?.trim() || null,
    role:        'member',
    is_super_admin: false,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
