import { deleteApp, initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth'
import {
  collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore'
import { firebaseConfig, getFirebaseDb } from "@/lib/firebase"
import { C, type AppUser } from '@/lib/schema'

export async function listDealers(): Promise<AppUser[]> {
  const snap = await getDocs(query(collection(getFirebaseDb(), C.users), where('role', '==', 'dealer')))
  return snap.docs
    .map((d) => ({ email: d.id, ...d.data() }) as AppUser)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export interface NewDealer {
  name: string
  email: string
  mobile: string
  address: string
  companyId: string
  passingLocation: string
  registrationLocation: string
  /** Optional: also create an email/password login. Google login works without it. */
  password: string
}

/**
 * Adds the dealer to the allow-list (users/{email}, role=dealer). If a password
 * is given, also creates their Firebase email/password account using a
 * throwaway app instance, so the admin stays signed in.
 */
export async function addDealer(input: NewDealer, adminEmail: string) {
  const email = input.email.trim().toLowerCase()
  const ref = doc(getFirebaseDb(), C.users, email)
  if ((await getDoc(ref)).exists()) throw new Error(`${email} is already registered.`)

  if (input.password) {
    const tmp = initializeApp(firebaseConfig, `create-${Date.now()}`)
    try {
      const tmpAuth = getAuth(tmp)
      await createUserWithEmailAndPassword(tmpAuth, email, input.password)
      await signOut(tmpAuth)
    } catch (e) {
      const code = (e as { code?: string }).code
      // Already has a login (e.g. created earlier) — fine, just add to the allow-list.
      if (code !== 'auth/email-already-in-use') throw e
    } finally {
      await deleteApp(tmp)
    }
  }

  await setDoc(ref, {
    name: input.name.trim(),
    email,
    role: 'dealer',
    active: true,
    companyId: input.companyId,
    mobile: input.mobile.trim(),
    address: input.address.trim(),
    passingLocation: input.passingLocation.trim(),
    registrationLocation: input.registrationLocation.trim(),
    createdAt: serverTimestamp(),
    createdBy: adminEmail,
  })
}

export async function setUserActive(email: string, active: boolean) {
  await updateDoc(doc(getFirebaseDb(), C.users, email), { active })
}
