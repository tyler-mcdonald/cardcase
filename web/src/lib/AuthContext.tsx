import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiRequest, type ApiResponse } from './api'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

type ActionResult = { ok: true } | { ok: false; error: string }

export type User = {
  id: string
  email: string
}

type AuthContextValue = {
  status: AuthStatus
  user: User | null
  requestLoginCode: (email: string) => Promise<ActionResult>
  confirmLoginCode: (code: string) => Promise<ActionResult>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const AUTH_API_BASE = '/_allauth/browser/v1'
const GENERIC_ERROR = 'Something went wrong. Please try again.'

function toActionResult(response: ApiResponse): ActionResult {
  const error = response.errors?.[0]?.message
  return error ? { ok: false, error } : { ok: true }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)

  const applySession = useCallback((response: ApiResponse<{ user?: User }>) => {
    if (response.meta?.is_authenticated) {
      setUser(response.data?.user ?? null)
      setStatus('authenticated')
    } else {
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await apiRequest<{ user?: User }>(`${AUTH_API_BASE}/auth/session`)
        applySession(response)
      } catch {
        setStatus('anonymous')
      }
    }
    loadSession()
  }, [applySession])

  async function requestLoginCode(email: string): Promise<ActionResult> {
    try {
      const response = await apiRequest(`${AUTH_API_BASE}/auth/code/request`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      return toActionResult(response)
    } catch {
      return { ok: false, error: GENERIC_ERROR }
    }
  }

  async function confirmLoginCode(code: string): Promise<ActionResult> {
    try {
      const response = await apiRequest<{ user?: User }>(`${AUTH_API_BASE}/auth/code/confirm`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      applySession(response)
      return toActionResult(response)
    } catch {
      return { ok: false, error: GENERIC_ERROR }
    }
  }

  async function logout() {
    try {
      const response = await apiRequest<{ user?: User }>(`${AUTH_API_BASE}/auth/session`, {
        method: 'DELETE',
      })
      applySession(response)
    } catch {
      // best-effort; the session cookie may still be valid server-side
    }
  }

  return (
    <AuthContext.Provider
      value={{ status, user, requestLoginCode, confirmLoginCode, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
