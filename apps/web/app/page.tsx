import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const baseUrl = process.env.CORE_API_BASE_URL ?? 'http://localhost:4000'

  let apiStatus = 'checking…'
  try {
    const res = await fetch(`${baseUrl}/health`, { cache: 'no-store' })
    const data = await res.json()
    apiStatus = data?.status ?? 'unknown'
  } catch {
    apiStatus = 'unreachable'
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">SaaS Platform</h1>
          <p className="text-muted-foreground">
            API status:{' '}
            <span className={apiStatus === 'ok' ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
              {apiStatus}
            </span>
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
