import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">User ID</p>
              <p className="text-sm font-mono text-muted-foreground">{user.userId}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick start</CardTitle>
            <CardDescription>What you can do next</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>✓ Account created and authenticated</p>
            <p>✓ JWT access + refresh tokens active</p>
            <p>→ Invite team members</p>
            <p>→ Create your first project</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
