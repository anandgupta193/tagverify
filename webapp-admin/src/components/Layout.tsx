import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/companies', label: 'Companies' },
  { to: '/dealers', label: 'Dealers' },
  { to: '/qr', label: 'QR codes' },
]

export default function Layout() {
  const { state, logout } = useAuth()
  const user = state.status === 'signedIn' ? state.user : null
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-slate-200 bg-white md:min-h-screen md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-5 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand font-bold text-white">TV</div>
          <div>
            <p className="font-semibold leading-tight">TagVerify</p>
            <p className="text-xs text-slate-500">Admin panel</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-brand-soft text-brand-dark' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-end gap-3 border-b border-slate-200 bg-white px-6 py-3">
          <span className="text-sm text-slate-600">{user?.name || user?.email}</span>
          <button onClick={logout} className="text-sm font-medium text-brand hover:underline">
            Log out
          </button>
        </header>
        <main className="mx-auto max-w-6xl space-y-6 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
