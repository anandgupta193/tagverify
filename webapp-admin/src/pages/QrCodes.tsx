import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Alert, Badge, Button, Card, Field, Input, Select, Table, Td, errorText, fmtDate } from '../components/ui'
import { useAdminEmail } from '../lib/auth'
import { downloadStickerSheet } from '../lib/pdf'
import { qrPng, qrUrlFor } from '../lib/qr'
import { qrIdFor, type AppUser, type Company, type QrBatch, type QrCode } from '../lib/schema'
import { listCompanies } from '../services/companies'
import { assignBatch, assignQr, findQr, generateBatch, listBatches } from '../services/qrcodes'
import { listDealers } from '../services/users'

type Msg = { tone: 'error' | 'success' | 'info'; text: string } | null

export default function QrCodes() {
  const admin = useAdminEmail()
  const [companies, setCompanies] = useState<Company[]>([])
  const [dealers, setDealers] = useState<AppUser[]>([])
  const [batches, setBatches] = useState<QrBatch[]>([])
  const [form, setForm] = useState({ companyId: '', productType: '', quantity: '100', dealerEmail: '' })
  const [msg, setMsg] = useState<Msg>(null)
  const [busy, setBusy] = useState('')

  const companyName = useMemo(() => Object.fromEntries(companies.map((c) => [c.id, c.name])), [companies])
  const dealerName = useMemo(() => Object.fromEntries(dealers.map((d) => [d.email, d.name])), [dealers])
  const dealersOf = (companyId: string) => dealers.filter((d) => d.companyId === companyId && d.active)

  const loadBatches = () => listBatches().then(setBatches).catch((e) => setMsg({ tone: 'error', text: errorText(e) }))
  useEffect(() => {
    listCompanies().then(setCompanies).catch(() => {})
    listDealers().then(setDealers).catch(() => {})
    loadBatches()
  }, [])

  const stickersFor = (b: QrBatch) =>
    Array.from({ length: b.toSerial - b.fromSerial + 1 }, (_, i) => ({
      qrId: qrIdFor(b.fromSerial + i),
      companyName: companyName[b.companyId] ?? b.companyId,
      productType: b.productType,
    }))

  const download = async (b: QrBatch) => {
    setBusy(`pdf-${b.id}`)
    try {
      await downloadStickerSheet(stickersFor(b), `TagVerify_${qrIdFor(b.fromSerial)}_to_${qrIdFor(b.toSerial)}.pdf`)
    } finally {
      setBusy('')
    }
  }

  const onGenerate = async (e: FormEvent) => {
    e.preventDefault()
    setBusy('generate')
    setMsg({ tone: 'info', text: 'Generating…' })
    try {
      const b = await generateBatch({ ...form, quantity: Number(form.quantity) }, admin)
      setMsg({ tone: 'success', text: `Created ${b.quantity} QR codes: ${qrIdFor(b.fromSerial)} – ${qrIdFor(b.toSerial)}. Downloading the sticker sheet…` })
      await loadBatches()
      await download(b)
    } catch (err) {
      setMsg({ tone: 'error', text: errorText(err) })
    } finally {
      setBusy('')
    }
  }

  const onAssign = async (b: QrBatch, email: string) => {
    setBusy(`assign-${b.id}`)
    try {
      await assignBatch(b, email)
      await loadBatches()
    } catch (err) {
      setMsg({ tone: 'error', text: errorText(err) })
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">QR codes</h1>

      <Card title="Generate QR batch">
        <form onSubmit={onGenerate} className="grid gap-4 md:grid-cols-4">
          <Field label="Company">
            <Select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value, dealerEmail: '' })} required>
              <option value="">Select…</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Product type">
            <Input value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} placeholder="e.g. Radium tape 50mm" required />
          </Field>
          <Field label="Quantity" hint="Serial numbers are assigned automatically">
            <Input type="number" min={1} max={2000} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
          </Field>
          <Field label="Give to dealer (optional)">
            <Select value={form.dealerEmail} onChange={(e) => setForm({ ...form, dealerEmail: e.target.value })} disabled={!form.companyId}>
              <option value="">Not assigned</option>
              {dealersOf(form.companyId).map((d) => <option key={d.email} value={d.email}>{d.name}</option>)}
            </Select>
          </Field>
          <div className="md:col-span-4 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy === 'generate'}>Generate & download stickers</Button>
            {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
          </div>
        </form>
      </Card>

      <Card title={`Batches (${batches.length})`}>
        <Table head={['Range', 'Qty', 'Company', 'Product', 'Dealer', 'Created', '']} empty={batches.length ? undefined : 'No QR codes generated yet.'}>
          {batches.map((b) => (
            <tr key={b.id}>
              <Td className="font-mono text-xs">{qrIdFor(b.fromSerial)} – {qrIdFor(b.toSerial)}</Td>
              <Td>{b.quantity}</Td>
              <Td>{companyName[b.companyId] ?? b.companyId}</Td>
              <Td>{b.productType}</Td>
              <Td>
                <select
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={b.dealerEmail ?? ''}
                  disabled={busy === `assign-${b.id}`}
                  onChange={(e) => onAssign(b, e.target.value)}
                >
                  <option value="">Not assigned</option>
                  {dealersOf(b.companyId).map((d) => <option key={d.email} value={d.email}>{d.name}</option>)}
                </select>
              </Td>
              <Td className="text-slate-500">{fmtDate(b.createdAt)}<br /><span className="text-xs">{b.createdBy}</span></Td>
              <Td className="text-right">
                <Button variant="secondary" disabled={busy === `pdf-${b.id}`} onClick={() => download(b)}>
                  {busy === `pdf-${b.id}` ? 'Preparing…' : 'Download PDF'}
                </Button>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <QrLookup companyName={companyName} dealerName={dealerName} dealersOf={dealersOf} />
    </>
  )
}

/** Look up one QR, see its status, and reprint it (e.g. a torn sticker). */
function QrLookup({
  companyName, dealerName, dealersOf,
}: {
  companyName: Record<string, string>
  dealerName: Record<string, string>
  dealersOf: (companyId: string) => AppUser[]
}) {
  const [term, setTerm] = useState('')
  const [qr, setQr] = useState<QrCode | null>(null)
  const [img, setImg] = useState('')
  const [msg, setMsg] = useState<Msg>(null)

  const search = async (e: FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setQr(null)
    try {
      const found = await findQr(term)
      if (!found) {
        setMsg({ tone: 'error', text: `No QR code ${term}.` })
        return
      }
      setQr(found)
      setImg(await qrPng(found.id, 320))
    } catch (err) {
      setMsg({ tone: 'error', text: errorText(err) })
    }
  }

  const reprint = () =>
    qr && downloadStickerSheet(
      [{ qrId: qr.id, companyName: companyName[qr.companyId] ?? qr.companyId, productType: qr.productType }],
      `TagVerify_${qr.id}_reprint.pdf`,
    )

  const reassign = async (email: string) => {
    if (!qr) return
    await assignQr(qr.id, email)
    setQr({ ...qr, dealerEmail: email })
  }

  return (
    <Card title="Find / reprint a QR code">
      <form onSubmit={search} className="flex flex-wrap gap-3">
        <div className="w-64"><Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="TV-000201 or 201" required /></div>
        <Button type="submit" variant="secondary">Find</Button>
      </form>
      {msg && <div className="mt-4"><Alert tone={msg.tone}>{msg.text}</Alert></div>}
      {qr && (
        <div className="mt-5 flex flex-wrap gap-6">
          {img && <img src={img} alt={`QR ${qr.id}`} className="h-40 w-40 rounded-lg border border-slate-200" />}
          <dl className="grid flex-1 grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-slate-500">QR ID</dt><dd className="font-mono">{qr.id}</dd>
            <dt className="text-slate-500">Status</dt>
            <dd>{qr.status === 'certified' ? <Badge tone="green">Certified</Badge> : <Badge tone="blue">Unused</Badge>}</dd>
            <dt className="text-slate-500">Company</dt><dd>{companyName[qr.companyId] ?? qr.companyId}</dd>
            <dt className="text-slate-500">Product</dt><dd>{qr.productType}</dd>
            <dt className="text-slate-500">Dealer</dt>
            <dd>
              <select className="rounded-md border border-slate-300 px-2 py-1" value={qr.dealerEmail ?? ''} onChange={(e) => reassign(e.target.value)}>
                <option value="">Not assigned</option>
                {dealersOf(qr.companyId).map((d) => <option key={d.email} value={d.email}>{dealerName[d.email]}</option>)}
              </select>
            </dd>
            <dt className="text-slate-500">Created</dt><dd>{fmtDate(qr.createdAt)} by {qr.createdBy}</dd>
            <dt className="text-slate-500">Public link</dt>
            <dd><a className="break-all text-brand underline" href={qrUrlFor(qr.id)} target="_blank" rel="noreferrer">{qrUrlFor(qr.id)}</a></dd>
            <dd className="col-span-2 pt-2"><Button onClick={reprint}>Reprint sticker (PDF)</Button></dd>
          </dl>
        </div>
      )}
    </Card>
  )
}
