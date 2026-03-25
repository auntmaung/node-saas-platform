'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const API = process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'

async function authHeaders() {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function listTenantsAction() {
  const res = await fetch(`${API}/tenants`, {
    headers: await authHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export async function createTenantAction(_prev: unknown, formData: FormData) {
  const name = (formData.get('name') as string).trim()
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  let res: Response
  try {
    res = await fetch(`${API}/tenants`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ name, slug }),
    })
  } catch {
    return { error: 'Cannot reach the API.' }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { error: body.message ?? 'Failed to create workspace.' }
  }

  const tenant = await res.json()
  const cookieStore = await cookies()
  cookieStore.set('current_tenant_id', tenant.id, { httpOnly: false, path: '/', maxAge: 60 * 60 * 24 * 30 })
  redirect('/dashboard')
}

export async function switchTenantAction(tenantId: string) {
  const cookieStore = await cookies()
  cookieStore.set('current_tenant_id', tenantId, { httpOnly: false, path: '/', maxAge: 60 * 60 * 24 * 30 })
  redirect('/dashboard')
}

export async function inviteMemberAction(_prev: unknown, formData: FormData) {
  const tenantId = formData.get('tenantId') as string
  const email = (formData.get('email') as string).trim().toLowerCase()
  const role = (formData.get('role') as string) || 'MEMBER'

  let res: Response
  try {
    res = await fetch(`${API}/tenants/${tenantId}/invites`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ email, role }),
    })
  } catch {
    return { error: 'Cannot reach the API.' }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = Array.isArray(body.message) ? body.message[0] : (body.message ?? 'Failed to send invite.')
    return { error: message }
  }

  revalidatePath('/dashboard/team')
  return { ok: true }
}
