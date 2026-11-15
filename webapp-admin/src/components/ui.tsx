// Small reusable UI kit so every page looks the same.
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

export function Button({
  variant = 'primary', className = '', ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-brand text-white hover:bg-brand-dark',
    secondary: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50',
    ghost: 'text-brand hover:bg-brand-soft/50',
    danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
  }[variant]
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      {...props}
    />
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputCls} {...props} />
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={inputCls} {...props}>
      {children}
    </select>
  )
}

export function Card({ title, actions, children }: { title?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {(title || actions) && (
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-slate-800">{title}</h2>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function Badge({ tone = 'slate', children }: { tone?: 'green' | 'slate' | 'blue' | 'red'; children: ReactNode }) {
  const t = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    blue: 'bg-brand-soft/60 text-brand-dark ring-brand-soft',
    red: 'bg-red-50 text-red-700 ring-red-200',
  }[tone]
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${t}`}>{children}</span>
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: ReactNode }) {
  const t = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-brand-soft bg-brand-soft/40 text-brand-dark',
  }[tone]
  return <div className={`rounded-lg border px-4 py-3 text-sm ${t}`}>{children}</div>
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
      {empty && <p className="px-3 py-6 text-center text-sm text-slate-500">{empty}</p>}
    </div>
  )
}

export const Td = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td>
)

export const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))

export const fmtDate = (t?: { toDate: () => Date } | null) =>
  t ? t.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
