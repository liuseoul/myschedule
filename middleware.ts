// Clerk's clerkMiddleware calls auth() on every request which makes a JWKS
// network call that hangs on Cloudflare Pages edge runtime immediately after
// login. Use a plain passthrough instead — auth is handled by each page.
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
