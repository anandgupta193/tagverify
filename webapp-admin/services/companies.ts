import {
  addDoc, collection, getDocs, orderBy, query, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { getFirebaseDb } from "@/lib/firebase"
import { C, type Company } from '@/lib/schema'

export async function listCompanies(): Promise<Company[]> {
  const snap = await getDocs(query(collection(getFirebaseDb(), C.companies), orderBy('name')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Company)
}

export async function addCompany(
  input: { name: string; copNumber: string; copValidity: string; logoUrl: string },
  adminEmail: string,
) {
  await addDoc(collection(getFirebaseDb(), C.companies), {
    name: input.name.trim(),
    copNumber: input.copNumber.trim(),
    copValidity: input.copValidity ? Timestamp.fromDate(new Date(input.copValidity)) : null,
    logoUrl: input.logoUrl.trim(),
    createdAt: serverTimestamp(),
    createdBy: adminEmail,
  })
}
