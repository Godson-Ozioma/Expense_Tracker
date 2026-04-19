import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

/** Dev: proxied via Vite `/api`. Prod: full URL e.g. `https://api.example.com/api/v1`. */
export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '/api/v1'

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

function clearAuthAndRedirect() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('username')
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login'
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    const url = originalRequest.url ?? ''
    const isTokenObtain =
      url.includes('/auth/token/') && !url.includes('refresh')

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isTokenObtain ||
      url.includes('/auth/register/')
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    const refresh = localStorage.getItem('refresh_token')
    if (!refresh) {
      clearAuthAndRedirect()
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post<{ access: string }>(
        `${API_BASE}/auth/token/refresh/`,
        { refresh },
        { headers: { 'Content-Type': 'application/json' } },
      )
      localStorage.setItem('access_token', data.access)
      originalRequest.headers.Authorization = `Bearer ${data.access}`
      return api(originalRequest)
    } catch {
      clearAuthAndRedirect()
      return Promise.reject(error)
    }
  },
)
