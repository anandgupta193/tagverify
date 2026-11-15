// Firestore schema shared with the Android app. Keep in sync with docs/DATA_MODEL.md.
import type { Timestamp } from 'firebase/firestore'

export const C = {
  users: 'users',
  companies: 'companies',
  qrBatches: 'qrBatches',
  qrCodes: 'qrCodes',
  certificates: 'certificates',
  masters: 'masters',
  counters: 'counters',
  publicCertificates: 'publicCertificates',
} as const

export type Role = 'admin' | 'dealer'

export interface AppUser {
  email: string
  name: string
  role: Role
  active: boolean
  companyId?: string
  mobile?: string
  address?: string
  passingLocation?: string
  registrationLocation?: string
  createdAt?: Timestamp
  createdBy?: string
}

export interface Company {
  id: string
  name: string
  logoUrl?: string
  copNumber?: string
  copValidity?: Timestamp | null
  createdAt?: Timestamp
  createdBy?: string
}

export interface QrBatch {
  id: string
  companyId: string
  productType: string
  quantity: number
  fromSerial: number
  toSerial: number
  dealerEmail?: string
  createdAt?: Timestamp
  createdBy?: string
}

export type QrStatus = 'unused' | 'certified'

export interface QrCode {
  id: string
  serial: number
  companyId: string
  productType: string
  batchId: string
  dealerEmail?: string
  status: QrStatus
  certificateId?: string
  createdAt?: Timestamp
  createdBy?: string
}

/** Public, read-only view of a certificate, keyed by qrId (no personal data). */
export interface PublicCertificate {
  qrId: string
  companyName: string
  productType?: string
  pdfUrl?: string
  certifiedAt?: Timestamp
}

/** Human QR code ID, e.g. serial 201 -> "TV-000201". */
export const qrIdFor = (serial: number) => `TV-${String(serial).padStart(6, '0')}`
