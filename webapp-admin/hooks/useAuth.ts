'use client'

import { useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
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
  /** True while we learn who is signed in and check their role (full-page spinner). */
  loading: boolean
  /** True while a sign-in button action is in progress (button spinner only). */
  signingIn: boolean
  /** Why the last sign-in was rejected (e.g. not an admin). */
  error: string | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const codeOf = (e: unknown) => (e as { code?: string }).code ?? ''

/**
 * Same shape as expense-manager's useAuth, plus a role gate: only users whose
 * users/{email} doc has role=admin and active=true may stay signed in.
 *
 * `loading` covers only the auth-state check, never the Google popup, so the
 * sign-in page stays visible while the popup is open (or blocked).
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
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
    setSigningIn(true)
    try {
      await signInWithPopup(getFirebaseAuth(), googleProvider)
    } catch (e) {
      const code = codeOf(e)
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        // Popup not allowed (common on mobile / installed PWA) — use a full-page redirect instead.
        await signInWithRedirect(getFirebaseAuth(), googleProvider)
        return
      }
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError('Google sign-in failed. Please try again.')
      }
    } finally {
      setSigningIn(false)
    }
  }

  async function signInWithEmail(email: string, password: string) {
    setError(null)
    setSigningIn(true)
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)
    } catch (e) {
      setError(codeOf(e).includes('invalid-credential') ? 'Wrong email or password.' : 'Sign-in failed. Try again.')
    } finally {
      setSigningIn(false)
    }
  }

  async function signOut() {
    await firebaseSignOut(getFirebaseAuth())
  }

  return { user, profile, loading, signingIn, error, signInWithGoogle, signInWithEmail, signOut }
}
