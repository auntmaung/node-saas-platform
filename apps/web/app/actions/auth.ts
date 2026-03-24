'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const API = process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'

function setTokenCookies(cookieStore: Awaited<ReturnType<typeof cookies>>, tokens: { accessToken: string; refreshToken: string }) {
  const secure = process.env.NODE_ENV === 'production'
  cookieStore.set('access_token', tokens.accessToken, {
    httpOnly: true, secure, sameSite: 'lax', maxAge: 900, path: '/',
  })
  cookieStore.set('refresh_token', tokens.refreshToken, {
    httpOnly: true, secure, sameSite: 'lax', maxAge: 1209600, path: '/',
  })
}

export async function loginAction(_prev: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  let res: Response
  try {
    res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    return { error: 'Cannot reach the API. Try again later.' }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { error: body.message ?? 'Invalid email or password.' }
  }

  const { tokens } = await res.json()
  setTokenCookies(await cookies(), tokens)
  redirect('/dashboard')
}

export async function registerAction(_prev: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  let res: Response
  try {
    res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: name || undefined }),
    })
  } catch {
    return { error: 'Cannot reach the API. Try again later.' }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { error: body.message ?? 'Registration failed.' }
  }

  const { tokens } = await res.json()
  setTokenCookies(await cookies(), tokens)
  redirect('/dashboard')
}

export async function logoutAction() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value

  if (refreshToken) {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
    } catch { /* best-effort */ }
  }

  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')
  redirect('/login')
}
