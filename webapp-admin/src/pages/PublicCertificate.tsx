import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { C, type PublicCertificate as Cert } from '../lib/schema'

/**
 * What anyone sees after scanning a sticker with a normal phone camera.
 * Reads publicCertificates/{qrId}, which holds no personal data.
 */
export default function PublicCertificate() {
  const { qrId = '' } = useParams()
  const [state, setState] = useState<'loading' | 'missing' | 'error' | Cert>('loading')

  useEffect(() => {
    getDoc(doc(db, C.publicCertificates, qrId.toUpperCase()))
      .then((s) => setState(s.exists() ? (s.data() as Cert) : 'missing'))
      .catch(() => setState('error'))
  }, [qrId])

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold tracking-wide text-brand">TagVerify</p>
        <p className="mt-1 font-mono text-xs text-slate-500">{qrId.toUpperCase()}</p>

        {state === 'loading' && <p className="mt-6 text-slate-500">Checking…</p>}

        {state === 'missing' && (
          <>
            <div className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-2xl">!</div>
            <h1 className="mt-4 text-xl font-semibold">Certificate not available</h1>
            <p className="mt-2 text-sm text-slate-600">
              This QR code hasn't been certified by an authorised dealer yet. If it's on a fitted radium, it may not be genuine.
            </p>
          </>
        )}

        {state === 'error' && <p className="mt-6 text-sm text-red-700">Couldn't check this code. Please try again.</p>}

        {typeof state === 'object' && (
          <>
            <div className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
            <h1 className="mt-4 text-xl font-semibold">Genuine radium</h1>
            <p className="mt-2 text-sm text-slate-600">
              Certified original product of <strong>{state.companyName}</strong>
              {state.productType ? ` (${state.productType})` : ''}.
            </p>
            {state.certifiedAt && (
              <p className="mt-1 text-xs text-slate-500">Certified on {state.certifiedAt.toDate().toLocaleDateString('en-IN')}</p>
            )}
            {state.pdfUrl && (
              <a
                href={state.pdfUrl}
                className="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
              >
                View certificate (PDF)
              </a>
            )}
          </>
        )}
      </div>
    </div>
  )
}
