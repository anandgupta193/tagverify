import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getCountFromServer, query, where } from 'firebase/firestore'
import { Card } from '../components/ui'
import { db } from '../lib/firebase'
import { C } from '../lib/schema'

export default function Dashboard() {
  const [stats, setStats] = useState<Record<string, number | null>>({})

  useEffect(() => {
    const count = async (key: string, q: Parameters<typeof getCountFromServer>[0]) => {
      try {
        const snap = await getCountFromServer(q)
        setStats((s) => ({ ...s, [key]: snap.data().count }))
      } catch {
        setStats((s) => ({ ...s, [key]: null }))
      }
    }
    count('companies', collection(db, C.companies))
    count('dealers', query(collection(db, C.users), where('role', '==', 'dealer')))
    count('qr', collection(db, C.qrCodes))
    count('certified', query(collection(db, C.qrCodes), where('status', '==', 'certified')))
  }, [])

  const tiles = [
    { key: 'companies', label: 'Companies', to: '/companies' },
    { key: 'dealers', label: 'Dealers', to: '/dealers' },
    { key: 'qr', label: 'QR codes generated', to: '/qr' },
    { key: 'certified', label: 'Certified', to: '/qr' },
  ]

  return (
    <>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.key} to={t.to} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand">
            <p className="text-sm text-slate-500">{t.label}</p>
            <p className="mt-1 text-3xl font-semibold">{stats[t.key] ?? '–'}</p>
          </Link>
        ))}
      </div>
      <Card title="Getting started">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Add a <Link className="text-brand underline" to="/companies">company</Link>.</li>
          <li>Add <Link className="text-brand underline" to="/dealers">dealers</Link> for it (their email is what lets them sign in to the app).</li>
          <li>Generate a <Link className="text-brand underline" to="/qr">QR batch</Link>, assign it to a dealer, and download the sticker sheet to print.</li>
        </ol>
      </Card>
    </>
  )
}
