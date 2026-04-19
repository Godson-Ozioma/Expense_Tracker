import { useEffect, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { Category, Expense } from '../types'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD']

type Props = {
  open: boolean
  onClose: () => void
  categories: Category[]
  expense: Expense | null
  onSaved: () => void
  onSubmit: (values: ExpenseFormValues) => Promise<void>
}

export type ExpenseFormValues = {
  amount: string
  currency: string
  spent_at: string
  note: string
  category: number | null
}

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const h = pad(d.getHours())
  const min = pad(d.getMinutes())
  return `${y}-${m}-${day}T${h}:${min}`
}

function localToIso(local: string): string {
  return new Date(local).toISOString()
}

export function ExpenseModal({
  open,
  onClose,
  categories,
  expense,
  onSaved,
  onSubmit,
}: Props) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [spentAt, setSpentAt] = useState('')
  const [note, setNote] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setErr(null)
    if (expense) {
      setAmount(expense.amount)
      setCurrency(expense.currency)
      setSpentAt(toLocalDatetimeValue(expense.spent_at))
      setNote(expense.note)
      setCategoryId(expense.category ?? '')
    } else {
      const now = new Date()
      setAmount('')
      setCurrency('USD')
      setSpentAt(toLocalDatetimeValue(now.toISOString()))
      setNote('')
      setCategoryId('')
    }
  }, [open, expense])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErr(null)
    setSaving(true)
    try {
      await onSubmit({
        amount,
        currency,
        spent_at: localToIso(spentAt),
        note,
        category: categoryId === '' ? null : Number(categoryId),
      })
      onSaved()
      onClose()
    } catch {
      setErr('Could not save. Check your values and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-modal-title"
            className="fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#101820] p-6 shadow-2xl shadow-black/50"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2
                id="expense-modal-title"
                className="text-lg font-semibold text-white"
              >
                {expense ? 'Edit expense' : 'New expense'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {err ? (
                <p className="rounded-lg border border-rose-500/30 bg-rose-950/50 px-3 py-2 text-sm text-rose-200">
                  {err}
                </p>
              ) : null}

              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Amount
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-600/40 bg-[#0a1016] px-4 py-2.5 font-mono text-[15px] text-slate-100 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Currency
                  </span>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-slate-600/40 bg-[#0a1016] px-3 py-2.5 text-[15px] text-slate-100 outline-none focus:border-emerald-500/50"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    When
                  </span>
                  <input
                    type="datetime-local"
                    required
                    value={spentAt}
                    onChange={(e) => setSpentAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-600/40 bg-[#0a1016] px-2 py-2.5 text-[14px] text-slate-100 outline-none focus:border-emerald-500/50"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Category
                </span>
                <select
                  value={categoryId === '' ? '' : String(categoryId)}
                  onChange={(e) =>
                    setCategoryId(
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                  className="w-full rounded-xl border border-slate-600/40 bg-[#0a1016] px-3 py-2.5 text-[15px] text-slate-100 outline-none focus:border-emerald-500/50"
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Note
                </span>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Coffee, groceries…"
                  className="w-full resize-none rounded-xl border border-slate-600/40 bg-[#0a1016] px-4 py-2.5 text-[15px] text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-900/25 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : expense ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
