'use client'

import { useEffect, useMemo, useState } from 'react'
import { App, Button, Descriptions, Form, Input, InputNumber, Select, Tag, theme } from 'antd'
import { DownloadOutlined, PlusOutlined, PrinterOutlined, SearchOutlined } from '@ant-design/icons'
import { FormSheet, PageHeader, ResponsiveList, SectionTitle, Surface, errorText, fmtDate } from '@/components/ui'
import { useActionParam } from '@/hooks/useActionParam'
import { useAdminEmail } from '@/hooks/useAdminEmail'
import { downloadStickerSheet } from '@/lib/pdf'
import { qrPng, qrUrlFor } from '@/lib/qr'
import { qrIdFor, type AppUser, type Company, type QrBatch, type QrCode } from '@/lib/schema'
import { listCompanies } from '@/services/companies'
import { assignBatch, assignQr, findQr, generateBatch, listBatches } from '@/services/qrcodes'
import { listDealers } from '@/services/users'

const range = (b: QrBatch) => `${qrIdFor(b.fromSerial)} – ${qrIdFor(b.toSerial)}`

export default function QrPage() {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const admin = useAdminEmail()
  const [companies, setCompanies] = useState<Company[]>([])
  const [dealers, setDealers] = useState<AppUser[]>([])
  const [batches, setBatches] = useState<QrBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState('')
  const [form] = Form.useForm()
  const formCompany = Form.useWatch('companyId', form)

  const companyName = useMemo(() => Object.fromEntries(companies.map((c) => [c.id, c.name])), [companies])
  const dealersOf = (companyId?: string) => dealers.filter((d) => d.companyId === companyId && d.active)
  const dealerOptions = (companyId?: string) => [
    { value: '', label: 'Not assigned' },
    ...dealersOf(companyId).map((d) => ({ value: d.email, label: d.name })),
  ]

  const loadBatches = () =>
    listBatches()
      .then(setBatches)
      .catch((e) => message.error(errorText(e)))
      .finally(() => setLoading(false))

  useEffect(() => {
    listCompanies().then(setCompanies).catch(() => {})
    listDealers().then(setDealers).catch(() => {})
    loadBatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useActionParam('generate', () => setOpen(true))

  const download = async (b: QrBatch) => {
    setBusy(`pdf-${b.id}`)
    try {
      const items = Array.from({ length: b.toSerial - b.fromSerial + 1 }, (_, i) => ({
        qrId: qrIdFor(b.fromSerial + i),
        companyName: companyName[b.companyId] ?? b.companyId,
        productType: b.productType,
      }))
      await downloadStickerSheet(items, `TagVerify_${qrIdFor(b.fromSerial)}_to_${qrIdFor(b.toSerial)}.pdf`)
    } finally {
      setBusy('')
    }
  }

  const onGenerate = async (v: { companyId: string; productType: string; quantity: number; unitQuantity?: string; dealerEmail?: string }) => {
    setBusy('generate')
    try {
      const b = await generateBatch({ ...v, unitQuantity: v.unitQuantity ?? 'Set of 2', dealerEmail: v.dealerEmail ?? '' }, admin)
      message.success(`Created ${b.quantity} QR codes (${range(b)})`)
      setOpen(false)
      form.resetFields()
      await loadBatches()
      await download(b)
    } catch (e) {
      message.error(errorText(e))
    } finally {
      setBusy('')
    }
  }

  const onAssign = async (b: QrBatch, email: string) => {
    setBatches((list) => list.map((x) => (x.id === b.id ? { ...x, dealerEmail: email } : x)))
    try {
      await assignBatch(b, email)
      message.success(email ? 'Batch assigned' : 'Batch unassigned')
    } catch (e) {
      message.error(errorText(e))
      loadBatches()
    }
  }

  const dealerSelect = (b: QrBatch) => (
    <Select size="middle" style={{ minWidth: 170 }} value={b.dealerEmail ?? ''} options={dealerOptions(b.companyId)} onChange={(e) => onAssign(b, e)} />
  )

  return (
    <>
      <PageHeader
        overline="QR codes"
        title="QR codes"
        subtitle="Generate sticker batches, hand them to dealers, reprint any code."
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} disabled={!companies.length}>Generate QR batch</Button>}
      />

      <Surface className="mb-6">
        <SectionTitle>Batches</SectionTitle>
        <ResponsiveList<QrBatch>
          rows={batches}
          loading={loading}
          rowKey={(b) => b.id}
          emptyText="No QR codes yet — generate your first batch."
          columns={[
            { title: 'Range', render: (_, b) => <span className="font-mono" style={{ fontSize: 13, fontWeight: 600 }}>{range(b)}</span> },
            { title: 'Qty', dataIndex: 'quantity' },
            { title: 'Company', render: (_, b) => companyName[b.companyId] ?? b.companyId },
            { title: 'Product', dataIndex: 'productType' },
            { title: 'Dealer', render: (_, b) => dealerSelect(b) },
            { title: 'Created', render: (_, b) => <span style={{ color: token.colorTextSecondary, fontSize: 12 }}>{fmtDate(b.createdAt)}</span> },
            {
              title: '',
              align: 'right',
              render: (_, b) => (
                <Button icon={<DownloadOutlined />} loading={busy === `pdf-${b.id}`} onClick={() => download(b)}>PDF</Button>
              ),
            },
          ]}
          renderCard={(b) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono" style={{ fontWeight: 700, color: token.colorText }}>{range(b)}</div>
                  <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                    {b.quantity} stickers · {companyName[b.companyId] ?? b.companyId} · {b.productType}
                  </div>
                </div>
                <Button shape="circle" icon={<DownloadOutlined />} loading={busy === `pdf-${b.id}`} onClick={() => download(b)} aria-label="Download stickers" />
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, color: token.colorTextSecondary }}>Dealer</span>
                <div className="flex-1">{dealerSelect(b)}</div>
              </div>
            </div>
          )}
        />
      </Surface>

      <QrLookup companyName={companyName} dealerOptions={dealerOptions} />

      <FormSheet open={open} title="Generate QR batch" onClose={() => setOpen(false)}>
        <Form form={form} layout="vertical" requiredMark={false} onFinish={onGenerate} initialValues={{ quantity: 100, unitQuantity: 'Set of 2', dealerEmail: '' }}>
          <Form.Item name="companyId" label="Company" rules={[{ required: true, message: 'Choose a company' }]}>
            <Select placeholder="Select a company" options={companies.map((c) => ({ value: c.id, label: c.name }))} onChange={() => form.setFieldValue('dealerEmail', '')} />
          </Form.Item>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="productType" label="Product type" rules={[{ required: true }]}>
              <Input placeholder="e.g. C3, CT" />
            </Form.Item>
            <Form.Item name="unitQuantity" label="Quantity per sticker" extra="Printed on the certificate">
              <Input placeholder="Set of 2" />
            </Form.Item>
          </div>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]} extra="Serial numbers are assigned automatically">
              <InputNumber min={1} max={2000} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="dealerEmail" label="Give to dealer">
              <Select options={dealerOptions(formCompany)} disabled={!formCompany} />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit" block size="large" loading={busy === 'generate'} icon={<PrinterOutlined />}>
            Generate &amp; download stickers
          </Button>
        </Form>
      </FormSheet>
    </>
  )
}

/** Look up one QR, see its status, reassign or reprint it (e.g. a torn sticker). */
function QrLookup({ companyName, dealerOptions }: { companyName: Record<string, string>; dealerOptions: (c?: string) => { value: string; label: string }[] }) {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const [qr, setQr] = useState<QrCode | null>(null)
  const [img, setImg] = useState('')
  const [searching, setSearching] = useState(false)

  const search = async (term: string) => {
    if (!term.trim()) return
    setSearching(true)
    try {
      const found = await findQr(term)
      setQr(found)
      if (!found) message.warning(`No QR code ${term.toUpperCase()}`)
      else setImg(await qrPng(found.id, 320))
    } catch (e) {
      message.error(errorText(e))
    } finally {
      setSearching(false)
    }
  }

  const reprint = () =>
    qr && downloadStickerSheet([{ qrId: qr.id, companyName: companyName[qr.companyId] ?? qr.companyId, productType: qr.productType }], `TagVerify_${qr.id}_reprint.pdf`)

  const reassign = async (email: string) => {
    if (!qr) return
    await assignQr(qr.id, email)
    setQr({ ...qr, dealerEmail: email })
    message.success('Dealer updated')
  }

  return (
    <Surface>
      <SectionTitle>Find or reprint a QR</SectionTitle>
      <Input.Search
        placeholder="TV-000201 or just 201"
        enterButton={<><SearchOutlined /> Find</>}
        size="large"
        loading={searching}
        onSearch={search}
        style={{ maxWidth: 420 }}
      />
      {qr && (
        <div className="mt-5 flex flex-col sm:flex-row gap-6 fade-up">
          {img && (
            <div className="self-center sm:self-start p-3 rounded-2xl" style={{ border: `1px solid ${token.colorBorderSecondary}`, background: '#fff' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`QR ${qr.id}`} width={160} height={160} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Descriptions
              column={1}
              size="small"
              items={[
                { label: 'QR ID', children: <span className="font-mono" style={{ fontWeight: 600 }}>{qr.id}</span> },
                { label: 'Status', children: qr.status === 'certified' ? <Tag color="success" variant="filled">Certified</Tag> : <Tag color="processing" variant="filled">Unused</Tag> },
                { label: 'Company', children: companyName[qr.companyId] ?? qr.companyId },
                { label: 'Product', children: qr.productType },
                { label: 'Dealer', children: <Select style={{ minWidth: 200 }} value={qr.dealerEmail ?? ''} options={dealerOptions(qr.companyId)} onChange={reassign} /> },
                { label: 'Created', children: `${fmtDate(qr.createdAt)} · ${qr.createdBy ?? ''}` },
                { label: 'Public link', children: <a href={qrUrlFor(qr.id)} target="_blank" rel="noreferrer" className="break-all">{qrUrlFor(qr.id)}</a> },
              ]}
            />
            <Button type="primary" icon={<PrinterOutlined />} className="mt-4" onClick={reprint}>Reprint sticker</Button>
          </div>
        </div>
      )}
    </Surface>
  )
}
