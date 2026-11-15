'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, getCountFromServer, query, where, type Query } from 'firebase/firestore'
import { Button, theme } from 'antd'
import { ArrowRightOutlined, BankOutlined, QrcodeOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons'
import { useAuthContext } from '@/app/providers'
import { PageHeader, StatCard, Surface, SectionTitle } from '@/components/ui'
import { PALETTE } from '@/constants/theme'
import { getFirebaseDb } from '@/lib/firebase'
import { C } from '@/lib/schema'

const STEPS = [
  { n: 1, title: 'Add a company', text: 'The brand whose radium you sell.', href: '/companies/?action=add', cta: 'Add company' },
  { n: 2, title: 'Add its dealers', text: 'Only these emails can sign in to the dealer app.', href: '/dealers/?action=add', cta: 'Add dealer' },
  { n: 3, title: 'Generate QR stickers', text: 'Sequential IDs, assigned to a dealer, ready to print.', href: '/qr/?action=generate', cta: 'Generate QR' },
]

export default function OverviewPage() {
  const { token } = theme.useToken()
  const { profile } = useAuthContext()
  const [stats, setStats] = useState<Record<string, number | null>>({})

  useEffect(() => {
    const db = getFirebaseDb()
    const count = (key: string, q: Query) =>
      getCountFromServer(q)
        .then((s) => setStats((p) => ({ ...p, [key]: s.data().count })))
        .catch(() => setStats((p) => ({ ...p, [key]: null })))
    count('companies', collection(db, C.companies))
    count('dealers', query(collection(db, C.users), where('role', '==', 'dealer')))
    count('qr', collection(db, C.qrCodes))
    count('certified', query(collection(db, C.qrCodes), where('status', '==', 'certified')))
  }, [])

  const v = (k: string) => (stats[k] === undefined ? '…' : stats[k] ?? '–')
  const first = profile?.name?.split(' ')[0]

  return (
    <>
      <PageHeader overline="Overview" title={first ? `Welcome back, ${first}` : 'Welcome back'} subtitle="Here's how your genuine-radium programme is doing." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 stagger">
        <StatCard label="QR codes" value={v('qr')} icon={<QrcodeOutlined />} tint={PALETTE.primary[500]} />
        <StatCard label="Certified" value={v('certified')} icon={<SafetyCertificateOutlined />} tint={PALETTE.success} />
        <StatCard label="Dealers" value={v('dealers')} icon={<TeamOutlined />} tint={PALETTE.primary[400]} />
        <StatCard label="Companies" value={v('companies')} icon={<BankOutlined />} tint={PALETTE.warning} />
      </div>

      <Surface>
        <SectionTitle>Get set up in three steps</SectionTitle>
        <div className="grid gap-3 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: token.colorFillAlter, border: `1px solid ${token.colorBorderSecondary}` }}>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `${token.colorPrimary}18`, color: token.colorPrimary }}>
                  {s.n}
                </span>
                <span style={{ fontWeight: 600, color: token.colorText }}>{s.title}</span>
              </div>
              <p style={{ margin: 0, color: token.colorTextSecondary, fontSize: 13 }}>{s.text}</p>
              <Link href={s.href} className="mt-auto">
                <Button type="link" style={{ padding: 0 }} icon={<ArrowRightOutlined />} iconPlacement="end">{s.cta}</Button>
              </Link>
            </div>
          ))}
        </div>
      </Surface>
    </>
  )
}
