import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth'
import { listTenantsAction, switchTenantAction } from '@/app/actions/tenant'
import { Button } from '@/components/ui/button'
import { SidebarNav } from '@/components/sidebar-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value
  if (!accessToken) redirect('/login')

  const tenants = await listTenantsAction()
  if (!tenants.length) redirect('/onboarding')

  // Resolve active tenant
  const savedId = cookieStore.get('current_tenant_id')?.value
  const activeTenant = tenants.find((t: any) => t.tenantId === savedId) ?? tenants[0]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top header */}
      <header className="h-14 border-b bg-background flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-lg">SaaS Platform</span>
          {/* Tenant switcher */}
          {tenants.length > 1 ? (
            <div className="flex items-center gap-1 ml-4">
              {tenants.map((t: any) => (
                <form key={t.tenantId} action={switchTenantAction.bind(null, t.tenantId)}>
                  <button
                    type="submit"
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      t.tenantId === activeTenant.tenantId
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {t.name}
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <span className="ml-4 text-sm text-muted-foreground border rounded px-2 py-0.5">
              {activeTenant.name}
            </span>
          )}
        </div>
        <form action={logoutAction}>
          <Button variant="outline" size="sm" type="submit">Sign out</Button>
        </form>
      </header>

      <div className="flex flex-1">
        {/* Left sidebar */}
        <aside className="w-56 border-r bg-background shrink-0 py-4">
          <SidebarNav />
        </aside>

        {/* Main content — inject tenantId via a data attribute so client pages can read it */}
        <main className="flex-1 bg-muted/40 p-8 overflow-auto" data-tenant-id={activeTenant.tenantId}>
          {children}
        </main>
      </div>
    </div>
  )
}
