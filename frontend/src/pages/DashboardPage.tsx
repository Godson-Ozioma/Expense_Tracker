import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  LogOut,
  PieChart,
  Plus,
  Tag,
  Trash2,
  Wallet,
  Pencil,
} from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Category, Expense, Paginated } from '../types'
import { ExpenseModal, type ExpenseFormValues } from '../components/ExpenseModal'
import { formatDateTime, formatMoney } from '../lib/format'

function startOfDayIso(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toISOString()
}

function endOfDayIso(dateStr: string): string {
  const d = new Date(`${dateStr}T23:59:59.999`)
  return d.toISOString()
}

async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<Paginated<Category>>('/categories/')
  return data.results
}

export function DashboardPage() {
  const { username, logout } = useAuth()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')

  const expenseParams = useMemo(() => {
    const p: Record<string, string | number> = { page }
    if (categoryFilter) p.category = Number(categoryFilter)
    if (dateFrom) p.date_from = startOfDayIso(dateFrom)
    if (dateTo) p.date_to = endOfDayIso(dateTo)
    return p
  }, [page, categoryFilter, dateFrom, dateTo])

  useEffect(() => {
    setPage(1)
  }, [categoryFilter, dateFrom, dateTo])

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const expensesQuery = useQuery({
    queryKey: ['expenses', expenseParams],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Expense>>('/expenses/', {
        params: expenseParams,
      })
      return data
    },
  })

  const categoryMap = useMemo(() => {
    const m = new Map<number, string>()
    ;(categoriesQuery.data ?? []).forEach((c) => m.set(c.id, c.name))
    return m
  }, [categoriesQuery.data])

  const pageSubtotal = useMemo(() => {
    const rows = expensesQuery.data?.results ?? []
    if (rows.length === 0) {
      return { text: formatMoney(0, 'USD'), detail: '' as const }
    }
    const cur0 = rows[0].currency
    const same = rows.every((e) => e.currency === cur0)
    const sum = rows.reduce((s, e) => s + Number(e.amount), 0)
    if (same) {
      return { text: formatMoney(sum, cur0), detail: '' as const }
    }
    return {
      text: '—',
      detail: 'mixed currencies on this page' as const,
    }
  }, [expensesQuery.data?.results])

  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      await api.post('/categories/', { name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setNewCategoryName('')
    },
  })

  const deleteCategory = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/categories/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })

  const saveExpense = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: number
      values: ExpenseFormValues
    }) => {
      const body = {
        amount: values.amount,
        currency: values.currency,
        spent_at: values.spent_at,
        note: values.note,
        category: values.category,
      }
      if (id) {
        await api.patch(`/expenses/${id}/`, body)
      } else {
        await api.post('/expenses/', body)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })

  const deleteExpense = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/expenses/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })

  const categories = categoriesQuery.data ?? []
  const expenseData = expensesQuery.data
  const results = expenseData?.results ?? []
  const loading = expensesQuery.isLoading || categoriesQuery.isLoading

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#070b10]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-700 text-slate-950 shadow-md shadow-emerald-900/30">
              <PieChart className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-white">
                Pulse
              </p>
              <p className="text-xs text-slate-500">Expense overview</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[10rem] truncate text-sm text-slate-400 sm:inline">
              {username}
            </span>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600/50 bg-[#121a22] px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 grid gap-4 sm:grid-cols-3"
        >
          <div className="rounded-2xl border border-emerald-500/10 bg-[#101820]/80 p-5 shadow-inner shadow-black/20">
            <div className="flex items-center gap-2 text-slate-500">
              <Wallet className="h-4 w-4" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wider">
                Page subtotal
              </span>
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-emerald-300">
              {pageSubtotal.text}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Sum on this page ({results.length} rows)
              {pageSubtotal.detail ? ` · ${pageSubtotal.detail}` : ''}
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#101820]/80 p-5">
            <div className="flex items-center gap-2 text-slate-500">
              <PieChart className="h-4 w-4" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wider">
                Total matching
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">
              {expenseData?.count ?? '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">All pages, current filters</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#101820]/80 p-5">
            <div className="flex items-center gap-2 text-slate-500">
              <Tag className="h-4 w-4" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wider">
                Categories
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">
              {categories.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">Labels you use for spend</p>
          </div>
        </motion.section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,220px)_1fr]">
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-white/5 bg-[#0e141b]/90 p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Tag className="h-4 w-4 text-emerald-500" aria-hidden />
                Categories
              </h2>
              <form
                className="mb-4 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  const name = newCategoryName.trim()
                  if (name) createCategory.mutate(name)
                }}
              >
                <input
                  placeholder="Add label"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-600/40 bg-[#0a1016] px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                />
                <button
                  type="submit"
                  disabled={!newCategoryName.trim() || createCategory.isPending}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-40"
                >
                  Add
                </button>
              </form>
              <ul className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {categories.map((c) => (
                    <motion.li
                      key={c.id}
                      layout
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-white/5"
                    >
                      <span className="truncate">{c.name}</span>
                      <button
                        type="button"
                        aria-label={`Delete category ${c.name}`}
                        className="rounded-md p-1 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-300"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete “${c.name}”? Expenses stay, but lose this label.`,
                            )
                          ) {
                            deleteCategory.mutate(c.id)
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              {categoriesQuery.isError ? (
                <p className="mt-2 text-xs text-rose-400">Could not load categories.</p>
              ) : null}
            </div>
          </motion.aside>

          <section className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/5 bg-[#0e141b]/90 p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Filter className="h-4 w-4 shrink-0" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Filters
                </span>
              </div>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-slate-500">Category</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-slate-600/40 bg-[#0a1016] px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
                >
                  <option value="">All</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-slate-500">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-xl border border-slate-600/40 bg-[#0a1016] px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-slate-500">To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-xl border border-slate-600/40 bg-[#0a1016] px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
                />
              </label>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0e141b]/90">
              <div className="flex items-center justify-between gap-4 border-b border-white/5 px-4 py-3 sm:px-5">
                <h2 className="text-sm font-semibold text-white">Transactions</h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null)
                    setModalOpen(true)
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-900/20"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Add expense
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  Loading…
                </div>
              ) : expensesQuery.isError ? (
                <p className="py-16 text-center text-sm text-rose-400">
                  Could not load expenses. Is the API running?
                </p>
              ) : results.length === 0 ? (
                <p className="py-16 text-center text-sm text-slate-500">
                  No expenses yet. Add your first one.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium sm:px-5">When</th>
                        <th className="px-4 py-3 font-medium sm:px-5">Amount</th>
                        <th className="hidden px-4 py-3 font-medium sm:table-cell sm:px-5">
                          Category
                        </th>
                        <th className="px-4 py-3 font-medium sm:px-5">Note</th>
                        <th className="w-24 px-4 py-3 font-medium sm:px-5" />
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence initial={false}>
                        {results.map((row) => (
                          <motion.tr
                            key={row.id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-b border-white/[0.04] last:border-0"
                          >
                            <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-slate-400 sm:px-5">
                              {formatDateTime(row.spent_at)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[15px] font-medium text-emerald-200 sm:px-5">
                              {formatMoney(row.amount, row.currency)}
                            </td>
                            <td className="hidden px-4 py-3.5 text-slate-400 sm:table-cell sm:px-5">
                              {row.category
                                ? categoryMap.get(row.category) ?? '—'
                                : '—'}
                            </td>
                            <td className="max-w-[12rem] truncate px-4 py-3.5 text-slate-400 sm:max-w-md sm:px-5">
                              {row.note || '—'}
                            </td>
                            <td className="px-4 py-3.5 sm:px-5">
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  aria-label="Edit expense"
                                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
                                  onClick={() => {
                                    setEditing(row)
                                    setModalOpen(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4" aria-hidden />
                                </button>
                                <button
                                  type="button"
                                  aria-label="Delete expense"
                                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
                                  onClick={() => {
                                    if (window.confirm('Delete this expense?')) {
                                      deleteExpense.mutate(row.id)
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}

              {expenseData && expenseData.count > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-4 py-3 text-sm text-slate-400 sm:px-5">
                  <span>
                    Page {page} — showing {results.length} of {expenseData.count}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!expenseData.previous}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-600/50 px-3 py-1.5 transition-colors hover:bg-white/5 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={!expenseData.next}
                      onClick={() => setPage((p) => p + 1)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-600/50 px-3 py-1.5 transition-colors hover:bg-white/5 disabled:opacity-30"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>

      <ExpenseModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        categories={categories}
        expense={editing}
        onSaved={() => {}}
        onSubmit={async (values) => {
          await saveExpense.mutateAsync({
            id: editing?.id,
            values,
          })
        }}
      />

      <motion.div
        className="pointer-events-none fixed bottom-6 right-6 z-20 sm:hidden"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <button
          type="button"
          aria-label="Add expense"
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-700 text-slate-950 shadow-xl shadow-emerald-900/40"
        >
          <Plus className="h-6 w-6" aria-hidden />
        </button>
      </motion.div>
    </div>
  )
}
