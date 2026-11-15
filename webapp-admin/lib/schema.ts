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
  gstin?: string
  aadhaarLast4?: string
  /** e.g. "CG04-RTO/ATS RAIPUR" — printed on certificates. */
  rtoLocation?: string
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
  /** Printed on the certificate, e.g. "Set of 2". */
  unitQuantity?: string
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

/** Public certificate behind every sticker URL (/c/<qrId>). Mirrors the sample installation certificate. */
export interface PublicCertificate {
  qrId: string
  qrSerial?: number
  certificateNo?: string
  companyName: string
  state?: string
  productType?: string
  quantity?: string
  copNumber?: string
  copValidity?: Timestamp | null
  vehicle?: {
    make?: string
    category?: string
    fuelType?: string
    passingRto?: string
    registrationRto?: string
    series?: string
    vehicleNumber?: string
    mfgYear?: string
    chassisNo?: string
    engineNo?: string
  }
  ownerName?: string
  ownerMobile?: string
  dealer?: { name?: string; gstin?: string; aadhaarMasked?: string; rtoLocation?: string }
  generatedAt?: { address?: string; lat?: number; lng?: number }
  imageUrls?: { frontLeft?: string; backRight?: string; numberPlate?: string; rcCopy?: string }
  certifiedAt?: Timestamp
  validFrom?: Timestamp
  validTill?: Timestamp
  pdfUrl?: string
}

/** Human QR code ID, e.g. serial 201 -> "TV-000201". */
export const qrIdFor = (serial: number) => `TV-${String(serial).padStart(6, '0')}`
