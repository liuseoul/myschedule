import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic =
    pathname.startsWith('/login') ||
    pathname === '/api/auth/login'

  if (!isPublic) {
    const auth = req.cookies.get('qt_auth')?.value
    if (!auth) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
