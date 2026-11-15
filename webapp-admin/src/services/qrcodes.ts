import {
  collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp,
  updateDoc, where, writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { C, qrIdFor, type QrBatch, type QrCode } from '../lib/schema'

const MAX_PER_BATCH = 2000
const WRITE_CHUNK = 450 // Firestore allows 500 writes per batch

export interface NewBatch {
  companyId: string
  productType: string
  quantity: number
  dealerEmail: string
}

/**
 * Reserves the next `quantity` serials atomically (counters/qrSerial), then
 * writes one qrCodes doc per sticker plus a qrBatches doc for the range.
 */
export async function generateBatch(input: NewBatch, adminEmail: string): Promise<QrBatch> {
  const quantity = Math.floor(input.quantity)
  if (quantity < 1 || quantity > MAX_PER_BATCH) {
    throw new Error(`Quantity must be between 1 and ${MAX_PER_BATCH}.`)
  }

  const counterRef = doc(db, C.counters, 'qrSerial')
  const fromSerial = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef)
    const next = snap.exists() ? (snap.data().next as number) : 1
    tx.set(counterRef, { next: next + quantity })
    return next
  })
  const toSerial = fromSerial + quantity - 1

  const batchRef = doc(collection(db, C.qrBatches))
  const batchData = {
    companyId: input.companyId,
    productType: input.productType.trim(),
    quantity,
    fromSerial,
    toSerial,
    dealerEmail: input.dealerEmail || '',
    createdAt: serverTimestamp(),
    createdBy: adminEmail,
  }

  for (let start = fromSerial; start <= toSerial; start += WRITE_CHUNK) {
    const wb = writeBatch(db)
    const end = Math.min(start + WRITE_CHUNK - 1, toSerial)
    for (let serial = start; serial <= end; serial++) {
      wb.set(doc(db, C.qrCodes, qrIdFor(serial)), {
        serial,
        companyId: batchData.companyId,
        productType: batchData.productType,
        batchId: batchRef.id,
        dealerEmail: batchData.dealerEmail,
        status: 'unused',
        createdAt: serverTimestamp(),
        createdBy: adminEmail,
      })
    }
    if (start === fromSerial) wb.set(batchRef, batchData)
    await wb.commit()
  }
  return { id: batchRef.id, ...batchData } as unknown as QrBatch
}

export async function listBatches(): Promise<QrBatch[]> {
  const snap = await getDocs(query(collection(db, C.qrBatches), orderBy('fromSerial', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as QrBatch)
}

/** Re-assigns every QR in a batch (and the batch itself) to a dealer. */
export async function assignBatch(batch: QrBatch, dealerEmail: string) {
  const codes = await getDocs(query(collection(db, C.qrCodes), where('batchId', '==', batch.id)))
  for (let i = 0; i < codes.docs.length; i += WRITE_CHUNK) {
    const wb = writeBatch(db)
    codes.docs.slice(i, i + WRITE_CHUNK).forEach((d) => wb.update(d.ref, { dealerEmail }))
    if (i === 0) wb.update(doc(db, C.qrBatches, batch.id), { dealerEmail })
    await wb.commit()
  }
}

/** Find a QR by its ID ("TV-000201") or bare serial ("201"). */
export async function findQr(input: string): Promise<QrCode | null> {
  const raw = input.trim().toUpperCase()
  const id = /^\d+$/.test(raw) ? qrIdFor(Number(raw)) : raw
  const snap = await getDoc(doc(db, C.qrCodes, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as QrCode) : null
}

export async function assignQr(qrId: string, dealerEmail: string) {
  await updateDoc(doc(db, C.qrCodes, qrId), { dealerEmail })
}

export async function recentQrs(n = 10): Promise<QrCode[]> {
  const snap = await getDocs(query(collection(db, C.qrCodes), orderBy('serial', 'desc'), limit(n)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as QrCode)
}
