import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      navigate('/', { replace: true })
    }
  }, [navigate])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      await register(username.trim(), password, email.trim() || undefined)
    } catch {
      setError('Could not register. The username may already exist.')
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
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Create account
          </h1>
          <p className="text-sm text-slate-400">
            Start tracking spending in minutes.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {error ? (
            <motion.p
              role="alert"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
              className="w-full rounded-xl border border-slate-600/40 bg-[#0a1016] px-4 py-3 text-[15px] text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/25"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
              Email{' '}
              <span className="font-normal normal-case text-slate-600">(optional)</span>
            </span>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-600/40 bg-[#0a1016] px-4 py-3 text-[15px] text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/25"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
              Password
            </span>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-600/40 bg-[#0a1016] px-4 py-3 text-[15px] text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/25"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <span className="mt-1 block text-xs text-slate-600">
              Minimum 8 characters (matches API rules).
            </span>
          </label>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.99 }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-900/30 transition-opacity disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            {loading ? 'Creating…' : 'Register'}
          </motion.button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-emerald-400 underline-offset-4 transition-colors hover:text-emerald-300 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
