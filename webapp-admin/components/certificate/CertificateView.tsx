'use client'

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, type ReactNode } from 'react'
import BrandMark from '@/components/BrandMark'
import { PALETTE } from '@/constants/theme'
import { qrPng } from '@/lib/qr'
import type { PublicCertificate } from '@/lib/schema'

const STATE_NAMES: Record<string, string> = {
  CG: 'CHHATTISGARH', MP: 'MADHYA PRADESH', MH: 'MAHARASHTRA', OD: 'ODISHA', JH: 'JHARKHAND', UP: 'UTTAR PRADESH',
}

type Ts = { toDate: () => Date } | null | undefined
const d = (t: Ts) => t?.toDate()
/** 5/8/2026 */
const short = (t: Ts) => {
  const x = d(t)
  return x ? `${x.getDate()}/${x.getMonth() + 1}/${x.getFullYear()}` : '—'
}
/** 05-08-2026 */
const dashed = (t: Ts) => {
  const x = d(t)
  return x ? `${String(x.getDate()).padStart(2, '0')}-${String(x.getMonth() + 1).padStart(2, '0')}-${x.getFullYear()}` : '—'
}
const up = (s?: string) => (s ? s.toUpperCase() : '—')

/** CG17 + LE9159 → "CG17-LE9159" */
function prettyVehicle(c: PublicCertificate) {
  const v = c.vehicle
  if (v?.registrationRto && v.series) return `${v.registrationRto}-${v.series}`.toUpperCase()
  return up(v?.vehicleNumber)
}

const PHOTOS: { key: keyof NonNullable<PublicCertificate['imageUrls']>; label: string }[] = [
  { key: 'frontLeft', label: 'FRONT LEFT IMAGE' },
  { key: 'backRight', label: 'BACK RIGHT IMAGE' },
  { key: 'numberPlate', label: 'NUMBER PLATE IMAGE' },
  { key: 'rcCopy', label: 'DOCUMENT IMAGE' },
]

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(120px,42%)_1fr] gap-x-2 py-[3px] text-[12.5px] leading-snug">
      <span className="text-[#353A54]">{label}</span>
      <span className="font-semibold text-[#14162A] break-words">: {value}</span>
    </div>
  )
}

function Band({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 mb-2 py-1.5 text-center text-[13px] font-bold tracking-wide text-[#14162A]" style={{ background: PALETTE.neutral[100] }}>
      {children}
    </div>
  )
}

/**
 * The installation certificate, laid out like the sample PDF. Renders as an
 * A4-proportioned sheet on screen and prints cleanly (Download PDF = print).
 */
export default function CertificateView({ c }: { c: PublicCertificate }) {
  const [qr, setQr] = useState('')
  useEffect(() => {
    qrPng(c.qrId, 300).then(setQr).catch(() => {})
  }, [c.qrId])

  const state = STATE_NAMES[(c.state || 'CG').toUpperCase()] ?? up(c.state)
  const g = c.generatedAt
  const generatedAt = g ? `${up(g.address)}${g.lat != null ? ` | ${g.lat.toFixed(6)}, ${g.lng?.toFixed(6)}` : ''}` : '—'
  const v = c.vehicle ?? {}

  return (
    <article className="certificate mx-auto bg-white text-[#14162A] shadow-[0_8px_40px_rgba(20,22,42,.12)] print:shadow-none" style={{ maxWidth: 820 }}>
      <div className="p-5 sm:p-8">
        {/* Header */}
        <header className="flex items-center gap-3 px-3 py-4 sm:px-5" style={{ background: PALETTE.neutral[100] }}>
          <div className="flex w-16 sm:w-24 justify-start">
            <div
              className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full text-lg sm:text-2xl font-extrabold"
              style={{ background: PALETTE.primary[50], color: PALETTE.primary[700], border: `2px solid ${PALETTE.primary[200]}` }}
              aria-label={c.companyName}
            >
              {c.companyName.split(/\s+/).map((w) => w[0]).slice(0, 3).join('').toUpperCase()}
            </div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-[17px] sm:text-[22px] font-extrabold tracking-wide leading-tight">INSTALLATION CERTIFICATE</h1>
            <p className="text-[12px] sm:text-[14px] font-bold tracking-wide">TAGVERIFY</p>
            <p className="text-[15px] sm:text-[19px] font-extrabold">{prettyVehicle(c)}</p>
          </div>
          <div className="flex w-16 sm:w-24 flex-col items-end sm:items-center gap-1">
            <BrandMark size={40} />
            <span className="hidden sm:block text-[11px] font-bold tracking-wider" style={{ color: PALETTE.neutral[500] }}>TAGVERIFY</span>
          </div>
        </header>

        <p className="mt-2 text-center text-[10.5px] italic">NOTE: THIS INSTALLATION CERTIFICATE IS ONLY VALID IN THE STATE OF {state}</p>

        {/* QR + key facts */}
        <section className="mt-2 flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col items-center sm:w-40 shrink-0">
            {qr ? <img src={qr} alt={`QR ${c.qrId}`} width={140} height={140} /> : <div className="h-[140px] w-[140px]" />}
            <span className="text-[11px] italic">(Scan To Verify)</span>
          </div>
          <div className="flex-1">
            <Row label="COP" value={up(c.copNumber)} />
            <Row label="COP VALIDITY" value={short(c.copValidity)} />
            <Row label="CERTIFICATE NUMBER" value={up(c.certificateNo)} />
            <Row label="QR CODE SERIAL NUMBER" value={c.qrSerial ?? c.qrId} />
            <Row label="DATE OF GENERATION" value={short(c.certifiedAt)} />
            <Row label="GENERATED AT" value={generatedAt} />
            <Row label="VALID FROM" value={dashed(c.validFrom)} />
            <Row label="VALID TILL" value={dashed(c.validTill)} />
            <Row label="VEHICLE NUMBER" value={up(v.vehicleNumber)} />
          </div>
        </section>

        <Band>MATERIAL DETAILS</Band>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-[12.5px]">
          <span>BRAND <b className="ml-3">: {up(c.companyName)}</b></span>
          <span>PRODUCT<b>: {up(c.productType)}</b></span>
          <span>QUANTITY<b>: {up(c.quantity || 'Set of 2')}</b></span>
        </div>

        <Band>VEHICLE DETAILS</Band>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <div>
            <Row label="OWNER NAME" value={up(c.ownerName)} />
            <Row label="VEHICLE MAKE" value={up(v.make)} />
            <Row label="CHASSIS NUMBER" value={up(v.chassisNo)} />
            <Row label="YEAR OF MANUFACTURING" value={v.mfgYear || '—'} />
          </div>
          <div>
            <Row label="OWNER PHONE" value={c.ownerMobile || '—'} />
            <Row label="VEHICLE CATEGORY" value={up(v.category)} />
            <Row label="ENGINE NUMBER" value={up(v.engineNo)} />
          </div>
        </div>

        <Band>FITMENT PHOTOGRAPHS</Band>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PHOTOS.map((p) => {
            const src = c.imageUrls?.[p.key]
            return (
              <figure key={p.key} className="m-0 text-center">
                <div className="aspect-[3/4] w-full overflow-hidden" style={{ background: PALETTE.neutral[100] }}>
                  {src && (
                    <a href={src} target="_blank" rel="noreferrer">
                      <img src={src} alt={p.label} className="h-full w-full object-cover" loading="lazy" />
                    </a>
                  )}
                </div>
                <figcaption className="mt-1 text-[10px] font-bold">{p.label}</figcaption>
              </figure>
            )
          })}
        </div>

        <Band>DEALER DETAILS</Band>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <div>
            <Row label="DEALER NAME" value={up(c.dealer?.name)} />
            <Row label="GSTIN" value={up(c.dealer?.gstin)} />
            <Row label="AADHAR NUMBER" value={c.dealer?.aadhaarMasked || '—'} />
          </div>
          <div>
            <Row label="RTO/ATS LOCATION" value={up(c.dealer?.rtoLocation)} />
          </div>
        </div>

        <div className="mt-5 text-[11.5px]">
          <p className="font-bold m-0">DECLARATION:</p>
          <p className="m-0">
            We hereby certify that we have supplied/installed the ARAI approved RRT as per the CMVR rule no 104/104D specified under CMVR GSR 784 (E) 291 (E).
          </p>
        </div>
        <p className="mt-10 text-right text-[11px] font-bold">(DEALER STAMP &amp; SIGN)</p>
      </div>
    </article>
  )
}
