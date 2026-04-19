export interface Category {
  id: number
  name: string
}

export interface Expense {
  id: number
  category: number | null
  amount: string
  currency: string
  spent_at: string
  note: string
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface TokenPair {
  access: string
  refresh: string
}
