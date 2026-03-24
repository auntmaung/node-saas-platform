import Link from 'next/link'

export default async function Home() {
  const baseUrl = process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'

  let api: any = null
  try {
    const res = await fetch(`${baseUrl}/health`, { cache: 'no-store' })
    api = await res.json()
  } catch {
    api = { error: 'core-api not reachable' }
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: 40, maxWidth: 480 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>SaaS Platform</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>API status: {api?.status ?? api?.error}</p>

      <div style={{ display: 'flex', gap: 12 }}>
        <Link href="/login" style={btnStyle('#6366f1', '#fff')}>Sign in</Link>
        <Link href="/register" style={btnStyle('#f3f4f6', '#111')}>Register</Link>
      </div>
    </main>
  )
}

function btnStyle(bg: string, color: string) {
  return {
    padding: '10px 20px',
    background: bg,
    color,
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 14,
    textDecoration: 'none',
  } as const
}
