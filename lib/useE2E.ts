'use client'

import { useState, useEffect, useRef } from 'react'
import type { KeyPair } from '@/lib/e2e'

export type E2EState = {
  keyPair: KeyPair | null
  ready: boolean
  error: string | null
}

export function useE2E(userId: string | null): E2EState {
  const [state, setState] = useState<E2EState>({ keyPair: null, ready: false, error: null })
  const initRef = useRef(false)

  useEffect(() => {
    if (!userId || initRef.current) return
    initRef.current = true

    import('@/lib/e2e')
      .then(({ initUserKeys }) => initUserKeys(userId))
      .then(keyPair => setState({ keyPair, ready: true, error: null }))
      .catch(err   => setState(s => ({ ...s, error: String(err) })))
  }, [userId])

  return state
}
