'use client'
import { useState, useEffect, useRef } from 'react'
import type { KeyPair } from './e2e'

export function useGroupKey(
  userId: string | null,
  groupId: string | null,
  keyPair: KeyPair | null
): Uint8Array | null {
  const [groupKey, setGroupKey] = useState<Uint8Array | null>(null)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!userId || !groupId || !keyPair || fetchedRef.current) return
    fetchedRef.current = true
    import('@/lib/e2e')
      .then(({ getGroupKey }) => getGroupKey(userId, groupId, keyPair))
      .then(key => { if (key) setGroupKey(key) })
      .catch(() => { fetchedRef.current = false })
  }, [userId, groupId, keyPair])

  return groupKey
}
