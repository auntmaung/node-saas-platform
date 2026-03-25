'use server'

import { cookies } from 'next/headers'
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

export async function listProjectsAction(tenantId: string, search?: string) {
  const params = new URLSearchParams({ page: '1', pageSize: '50' })
  if (search) params.set('search', search)
  const res = await fetch(`${API}/tenants/${tenantId}/projects?${params}`, {
    headers: await authHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) return { items: [], total: 0, page: 1, pageSize: 50, totalPages: 0 }
  return res.json()
}

export async function createProjectAction(_prev: unknown, formData: FormData) {
  const tenantId = formData.get('tenantId') as string
  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string)?.trim() || undefined

  let res: Response
  try {
    res = await fetch(`${API}/tenants/${tenantId}/projects`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ name, description }),
    })
  } catch {
    return { error: 'Cannot reach the API.' }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = Array.isArray(body.message) ? body.message[0] : (body.message ?? 'Failed to create project.')
    return { error: message }
  }

  revalidatePath('/dashboard/projects')
  return { ok: true }
}

export async function deleteProjectAction(tenantId: string, projectId: string) {
  await fetch(`${API}/tenants/${tenantId}/projects/${projectId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  revalidatePath('/dashboard/projects')
}
