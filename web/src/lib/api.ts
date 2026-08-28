import Cookies from 'js-cookie'

const API_URL = import.meta.env.VITE_API_URL

export type ApiError = {
  message: string
  code?: string
  param?: string
}

export type ApiResponse<T = unknown> = {
  status: number
  data?: T
  meta?: {
    is_authenticated?: boolean
    [key: string]: unknown
  }
  errors?: ApiError[]
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const method = options.method ?? 'GET'
  const headers = new Headers(options.headers)

  if (method !== 'GET') {
    headers.set('Content-Type', 'application/json')
    const csrfToken = Cookies.get('csrftoken')
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken)
    }
  }

  const response = await fetch(new URL(path, API_URL), {
    ...options,
    method,
    headers,
    credentials: 'include',
  })

  return (await response.json()) as ApiResponse<T>
}
