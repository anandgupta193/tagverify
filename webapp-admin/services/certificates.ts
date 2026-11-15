import {
  collection, doc, getDocs, limit, orderBy, query, serverTimestamp, writeBatch, type Timestamp,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase'
import { C, type PublicCertificate } from '@/lib/schema'

export type Vehicle = NonNullable<PublicCertificate['vehicle']>

/** certificates/{id} — the full record written by the dealer app. */
export interface Certificate {
  id: string
  qrId: string
  certificateNo?: string
  companyId?: string
  companyName?: string
  productType?: string
  quantity?: string
  dealerEmail?: string
  dealerName?: string
  vehicle?: Vehicle
  owner?: { name?: string; mobile?: string }
  createdAt?: Timestamp
  updatedAt?: Timestamp
  updatedBy?: string
}

/** What an admin can correct — the values the dealer typed in. */
export interface CertificateEdit {
  vehicle: Required<Omit<Vehicle, 'vehicleNumber'>>
  ownerName: string
  ownerMobile: string
  quantity: string
}

export async function listCertificates(max = 500): Promise<Certificate[]> {
  const snap = await getDocs(query(collection(getFirebaseDb(), C.certificates), orderBy('createdAt', 'desc'), limit(max)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Certificate)
}

/**
 * Saves the correction to the private record and the public certificate (/c/<qrId>)
 * in one batch, so what people see when they scan always matches the record.
 */
export async function updateCertificate(cert: Certificate, edit: CertificateEdit, adminEmail: string) {
  const v = edit.vehicle
  const vehicle: Vehicle = {
    make: v.make,
    category: v.category,
    fuelType: v.fuelType,
    passingRto: v.passingRto,
    registrationRto: v.registrationRto,
    series: v.series.trim().toUpperCase(),
    vehicleNumber: `${v.registrationRto}${v.series.trim().toUpperCase()}`,
    mfgYear: v.mfgYear,
    chassisNo: v.chassisNo.trim().toUpperCase(),
    engineNo: v.engineNo.trim().toUpperCase(),
  }
  const ownerName = edit.ownerName.trim()
  const ownerMobile = edit.ownerMobile.trim()
  const quantity = edit.quantity.trim()

  const db = getFirebaseDb()
  const batch = writeBatch(db)
  batch.update(doc(db, C.certificates, cert.id), {
    vehicle,
    owner: { name: ownerName, mobile: ownerMobile },
    quantity,
    updatedAt: serverTimestamp(),
    updatedBy: adminEmail,
  })
  batch.update(doc(db, C.publicCertificates, cert.qrId), { vehicle, ownerName, ownerMobile, quantity })
  await batch.commit()
}
