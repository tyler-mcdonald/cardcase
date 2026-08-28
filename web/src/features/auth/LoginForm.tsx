import { useState, type FormEvent } from 'react'
import { useAuth } from '@/lib/AuthContext'

export function LoginForm() {
  const { requestLoginCode, confirmLoginCode } = useAuth()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(
    event: FormEvent,
    action: () => ReturnType<typeof requestLoginCode>,
    onSuccess?: () => void,
  ) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await action()
    setSubmitting(false)
    if (result.ok) {
      onSuccess?.()
    } else {
      setError(result.error)
    }
  }

  const handleRequestCode = (event: FormEvent) =>
    submit(event, () => requestLoginCode(email), () => setStep('code'))

  const handleConfirmCode = (event: FormEvent) => submit(event, () => confirmLoginCode(code))

  return (
    <main>
      <h1>Log in</h1>
      {step === 'email' ? (
        <form onSubmit={handleRequestCode}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="submit" disabled={submitting}>
            Send login code
          </button>
        </form>
      ) : (
        <form onSubmit={handleConfirmCode}>
          <p>Enter the code sent to {email}</p>
          <label htmlFor="code">Code</label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <button type="submit" disabled={submitting}>
            Confirm
          </button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
    </main>
  )
}
