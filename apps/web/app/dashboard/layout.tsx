import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { SidebarNav } from '@/components/sidebar-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value
  if (!accessToken) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top header */}
      <header className="h-14 border-b bg-background flex items-center justify-between px-6 shrink-0">
        <span className="font-semibold text-lg">SaaS Platform</span>
        <form action={logoutAction}>
          <Button variant="outline" size="sm" type="submit">Sign out</Button>
        </form>
      </header>

      <div className="flex flex-1">
        {/* Left sidebar */}
        <aside className="w-56 border-r bg-background shrink-0 py-4">
          <SidebarNav />
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-muted/40 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
