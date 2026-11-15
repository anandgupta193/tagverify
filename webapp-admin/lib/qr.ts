import QRCode from 'qrcode'
import { PUBLIC_BASE_URL } from '@/lib/firebase'

/** The URL a QR sticker encodes. Any phone camera opens it in the browser. */
export const qrUrlFor = (qrId: string) => `${PUBLIC_BASE_URL}/c/${encodeURIComponent(qrId)}`

/** PNG data URL of the QR image, high error correction so scratched stickers still scan. */
export const qrPng = (qrId: string, size = 512) =>
  QRCode.toDataURL(qrUrlFor(qrId), { errorCorrectionLevel: 'H', margin: 1, width: size })
