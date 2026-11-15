import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Card, Field, Input, Table, Td, errorText, fmtDate } from '../components/ui'
import { useAdminEmail } from '../lib/auth'
import type { Company } from '../lib/schema'
import { addCompany, listCompanies } from '../services/companies'

const empty = { name: '', copNumber: '', copValidity: '', logoUrl: '' }

export default function Companies() {
  const admin = useAdminEmail()
  const [companies, setCompanies] = useState<Company[]>([])
  const [form, setForm] = useState(empty)
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () => listCompanies().then(setCompanies).catch((e) => setMsg({ tone: 'error', text: errorText(e) }))
  useEffect(() => { load() }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await addCompany(form, admin)
      setMsg({ tone: 'success', text: `Added ${form.name}.` })
      setForm(empty)
      await load()
    } catch (err) {
      setMsg({ tone: 'error', text: errorText(err) })
    } finally {
      setBusy(false)
    }
  }

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  return (
    <>
      <h1 className="text-2xl font-semibold">Companies</h1>
      <Card title="Add company">
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <Field label="Company name"><Input value={form.name} onChange={set('name')} required /></Field>
          <Field label="COP number"><Input value={form.copNumber} onChange={set('copNumber')} /></Field>
          <Field label="COP validity"><Input type="date" value={form.copValidity} onChange={set('copValidity')} /></Field>
          <Field label="Logo URL" hint="Optional for now"><Input value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://…" /></Field>
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={busy}>Add company</Button>
            {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
          </div>
        </form>
      </Card>

      <Card title={`All companies (${companies.length})`}>
        <Table head={['Name', 'COP number', 'COP validity', 'ID', 'Added']} empty={companies.length ? undefined : 'No companies yet.'}>
          {companies.map((c) => (
            <tr key={c.id}>
              <Td className="font-medium">{c.name}</Td>
              <Td>{c.copNumber || '—'}</Td>
              <Td>{c.copValidity ? c.copValidity.toDate().toLocaleDateString('en-IN') : '—'}</Td>
              <Td className="font-mono text-xs text-slate-500">{c.id}</Td>
              <Td className="text-slate-500">{fmtDate(c.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  )
}
