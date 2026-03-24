'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { loginAction } from '@/app/actions/auth'
import styles from '../auth.module.css'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={styles.button} disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, null)

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>Welcome back</p>

        <form action={action} className={styles.form}>
          {state?.error && <p className={styles.error}>{state.error}</p>}

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>

          <SubmitButton />
        </form>

        <p className={styles.footer}>
          No account? <Link href="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}
