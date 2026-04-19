import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username.trim(), password)
    } catch {
      setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-emerald-500/15 bg-[#101820]/90 p-8 shadow-[0_0_60px_-12px_rgba(16,185,129,0.25)] backdrop-blur-md"
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-700 text-slate-950 shadow-lg shadow-emerald-900/40">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white">
                Pulse
              </h1>
              <p className="text-sm text-slate-400">Expense tracker</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {error ? (
              <motion.p
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-sm text-rose-200"
              >
                {error}
              </motion.p>
            ) : null}

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Username
              </span>
              <input
                className="w-full rounded-xl border border-slate-600/40 bg-[#0a1016] px-4 py-3 text-[15px] text-slate-100 outline-none ring-emerald-500/0 transition-[box-shadow,border-color] placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/25"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Password
              </span>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-600/40 bg-[#0a1016] px-4 py-3 text-[15px] text-slate-100 outline-none ring-emerald-500/0 transition-[box-shadow,border-color] placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/25"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={1}
              />
            </label>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-900/30 transition-opacity disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              {loading ? 'Signing in…' : 'Sign in'}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            No account?{' '}
            <Link
              to="/register"
              className="font-medium text-emerald-400 underline-offset-4 transition-colors hover:text-emerald-300 hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
