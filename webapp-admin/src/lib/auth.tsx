import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { ADMIN_NAME, auth, db } from './firebase'
import { C, type AppUser } from './schema'

type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut'; message?: string }
  | { status: 'signedIn'; user: AppUser }

interface AuthApi {
  state: AuthState
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthApi | null>(null)

/**
 * Same idea as the Android AuthViewModel: listen to Firebase auth, then require
 * an active users/{email} doc. The admin panel additionally requires role=admin.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let pending: string | undefined
    return onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setState({ status: 'signedOut', message: pending })
        pending = undefined
        return
      }
      setState({ status: 'loading' })
      const email = fbUser.email?.trim().toLowerCase()
      try {
        const snap = email ? await getDoc(doc(db, C.users, email)) : null
        const profile = snap?.exists() ? ({ email, ...snap.data() } as AppUser) : null
        if (!profile || profile.role !== 'admin' || profile.active !== true) {
          pending = `${email ?? 'This account'} is not an admin. Please contact ${ADMIN_NAME}.`
          await signOut(auth)
          return
        }
        setState({ status: 'signedIn', user: profile })
      } catch {
        pending = "Couldn't verify your account. Check your internet and try again."
        await signOut(auth)
      }
    })
  }, [])

  const api: AuthApi = {
    state,
    signInWithGoogle: async () => {
      await signInWithPopup(auth, new GoogleAuthProvider())
    },
    signInWithEmail: async (email, password) => {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    },
    logout: () => signOut(auth),
  }
  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** The signed-in admin's email, for createdBy fields. */
export function useAdminEmail(): string {
  const { state } = useAuth()
  return state.status === 'signedIn' ? state.user.email : ''
}
