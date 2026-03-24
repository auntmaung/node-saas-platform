import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth'
import styles from './dashboard.module.css'

const API = process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'

async function getMe(accessToken: string) {
  const res = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value
  if (!accessToken) redirect('/login')

  const user = await getMe(accessToken)
  if (!user) redirect('/login')

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.logo}>SaaS Platform</h1>
        <form action={logoutAction}>
          <button type="submit" className={styles.logoutBtn}>Sign out</button>
        </form>
      </div>

      <main className={styles.main}>
        <div className={styles.card}>
          <p className={styles.welcome}>Welcome back</p>
          <h2 className={styles.email}>{user.email}</h2>
          <p className={styles.userId}>User ID: {user.userId}</p>
        </div>
      </main>
    </div>
  )
}
