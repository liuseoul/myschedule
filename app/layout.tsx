export const runtime = 'edge'

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'My Schedule',
  description: 'Personal schedule management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
