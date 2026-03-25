import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InviteForm } from './invite-form'

const API = process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'

async function getMembers(tenantId: string, accessToken: string) {
  const res = await fetch(`${API}/tenants/${tenantId}/members`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

const ROLE_BADGE: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  MEMBER: 'bg-gray-100 text-gray-600',
}

export default async function TeamPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value ?? ''
  const tenantId = cookieStore.get('current_tenant_id')?.value ?? ''

  const members = await getMembers(tenantId, accessToken)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Team</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invite form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Invite member</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteForm tenantId={tenantId} />
          </CardContent>
        </Card>

        {/* Members list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Members ({members.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.map((m: any) => (
              <div key={m.userId} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{m.name ?? m.email}</p>
                  {m.name && <p className="text-xs text-muted-foreground">{m.email}</p>}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[m.role] ?? ROLE_BADGE.MEMBER}`}>
                  {m.role}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
