'use client'

import { useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { ADMIN_NAME, getFirebaseAuth, getFirebaseDb, googleProvider } from '@/lib/firebase'
import { C, type AppUser } from '@/lib/schema'

export interface AuthState {
  user: User | null
  /** users/{email} profile — only set when the user is an active admin. */
  profile: AppUser | null
  loading: boolean
  /** Why the last sign-in was rejected (e.g. not an admin). */
  error: string | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

/**
 * Same shape as expense-manager's useAuth, plus a role gate: only users whose
 * users/{email} doc has role=admin and active=true may stay signed in.
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const auth = getFirebaseAuth()
    return onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      setLoading(true)
      const email = fbUser.email?.trim().toLowerCase() ?? ''
      try {
        const snap = await getDoc(doc(getFirebaseDb(), C.users, email))
        const p = snap.exists() ? ({ email, ...snap.data() } as AppUser) : null
        if (!p || p.role !== 'admin' || p.active !== true) {
          setError(`${email || 'This account'} is not an admin. Please contact ${ADMIN_NAME}.`)
          await firebaseSignOut(auth)
          return
        }
        setError(null)
        setProfile(p)
        setUser(fbUser)
      } catch {
        setError("Couldn't verify your account. Check your internet and try again.")
        await firebaseSignOut(auth)
      } finally {
        setLoading(false)
      }
    })
  }, [])

  async function signInWithGoogle() {
    setError(null)
    setLoading(true)
    try {
      await signInWithPopup(getFirebaseAuth(), googleProvider)
    } catch {
      setLoading(false)
    }
  }

  async function signInWithEmail(email: string, password: string) {
    setError(null)
    setLoading(true)
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)
    } catch (e) {
      const code = (e as { code?: string }).code ?? ''
      setError(code.includes('invalid-credential') ? 'Wrong email or password.' : 'Sign-in failed. Try again.')
      setLoading(false)
    }
  }

  async function signOut() {
    await firebaseSignOut(getFirebaseAuth())
  }

  return { user, profile, loading, error, signInWithGoogle, signInWithEmail, signOut }
}
