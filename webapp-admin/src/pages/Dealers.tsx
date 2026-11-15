import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Alert, Badge, Button, Card, Field, Input, Select, Table, Td, errorText } from '../components/ui'
import { useAdminEmail } from '../lib/auth'
import type { AppUser, Company } from '../lib/schema'
import { listCompanies } from '../services/companies'
import { addDealer, listDealers, setUserActive, type NewDealer } from '../services/users'

const empty: NewDealer = {
  name: '', email: '', mobile: '', address: '', companyId: '',
  passingLocation: '', registrationLocation: '', password: '',
}

export default function Dealers() {
  const admin = useAdminEmail()
  const [dealers, setDealers] = useState<AppUser[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [form, setForm] = useState(empty)
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const companyName = useMemo(() => Object.fromEntries(companies.map((c) => [c.id, c.name])), [companies])
  const load = () => listDealers().then(setDealers).catch((e) => setMsg({ tone: 'error', text: errorText(e) }))

  useEffect(() => {
    load()
    listCompanies().then(setCompanies).catch(() => {})
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.password && form.password.length < 6) {
      setMsg({ tone: 'error', text: 'Password must be at least 6 characters (or leave it empty for Google-only login).' })
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      await addDealer(form, admin)
      setMsg({ tone: 'success', text: `Added ${form.email}. They can now sign in to the app.` })
      setForm(empty)
      await load()
    } catch (err) {
      setMsg({ tone: 'error', text: errorText(err) })
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (d: AppUser) => {
    await setUserActive(d.email, !d.active)
    await load()
  }

  const set = (k: keyof NewDealer) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <>
      <h1 className="text-2xl font-semibold">Dealers</h1>
      <Card title="Add dealer">
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <Field label="Dealer name"><Input value={form.name} onChange={set('name')} required /></Field>
          <Field label="Email" hint="Only this email can sign in to the dealer app (Google or password).">
            <Input type="email" value={form.email} onChange={set('email')} required />
          </Field>
          <Field label="Company">
            <Select value={form.companyId} onChange={set('companyId')} required>
              <option value="">Select a company…</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Mobile number"><Input value={form.mobile} onChange={set('mobile')} /></Field>
          <Field label="Address"><Input value={form.address} onChange={set('address')} /></Field>
          <Field label="Passing location"><Input value={form.passingLocation} onChange={set('passingLocation')} /></Field>
          <Field label="Registration location"><Input value={form.registrationLocation} onChange={set('registrationLocation')} /></Field>
          <Field label="Password (optional)" hint="Set one to allow email/password login. Leave empty for Google-only.">
            <Input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
          </Field>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy || !companies.length}>Add dealer</Button>
            {!companies.length && <span className="text-sm text-slate-500">Add a company first.</span>}
            {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
          </div>
        </form>
      </Card>

      <Card title={`All dealers (${dealers.length})`}>
        <Table head={['Name', 'Email', 'Company', 'Mobile', 'Status', '']} empty={dealers.length ? undefined : 'No dealers yet.'}>
          {dealers.map((d) => (
            <tr key={d.email}>
              <Td className="font-medium">{d.name}</Td>
              <Td>{d.email}</Td>
              <Td>{companyName[d.companyId ?? ''] ?? d.companyId}</Td>
              <Td>{d.mobile || '—'}</Td>
              <Td>{d.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}</Td>
              <Td className="text-right">
                <Button variant={d.active ? 'danger' : 'secondary'} onClick={() => toggle(d)}>
                  {d.active ? 'Deactivate' : 'Activate'}
                </Button>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  )
}
