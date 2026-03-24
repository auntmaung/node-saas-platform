'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { registerAction } from '@/app/actions/auth'
import styles from '../auth.module.css'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={styles.button} disabled={pending}>
      {pending ? 'Creating account…' : 'Create account'}
    </button>
  )
}

export default function RegisterPage() {
  const [state, action] = useActionState(registerAction, null)

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Get started for free</p>

        <form action={action} className={styles.form}>
          {state?.error && <p className={styles.error}>{state.error}</p>}

          <div className={styles.field}>
            <label htmlFor="name">Name <span style={{ color: '#9ca3af' }}>(optional)</span></label>
            <input id="name" name="name" type="text" autoComplete="name" />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password <span style={{ color: '#9ca3af' }}>(min 8 chars)</span></label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </div>

          <SubmitButton />
        </form>

        <p className={styles.footer}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
