import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { listProjectsAction, deleteProjectAction } from '@/app/actions/projects'
import { listTenantsAction } from '@/app/actions/tenant'
import { CreateProjectForm } from './create-project-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function ProjectsPage() {
  const cookieStore = await cookies()

  // Resolve active tenant the same way the layout does
  const tenants = await listTenantsAction()
  if (!tenants.length) redirect('/onboarding')
  const savedId = cookieStore.get('current_tenant_id')?.value
  const activeTenant = tenants.find((t: any) => t.tenantId === savedId) ?? tenants[0]
  const tenantId = activeTenant.tenantId

  const { items: projects } = await listProjectsAction(tenantId)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">New project</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateProjectForm tenantId={tenantId} />
          </CardContent>
        </Card>

        {/* Project list */}
        <div className="lg:col-span-2 space-y-3">
          {projects.length === 0 && (
            <p className="text-sm text-muted-foreground">No projects yet. Create your first one.</p>
          )}
          {projects.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="flex items-start justify-between pt-4">
                <div>
                  <p className="font-medium">{p.name}</p>
                  {p.description && <p className="text-sm text-muted-foreground mt-0.5">{p.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <form action={deleteProjectAction.bind(null, tenantId, p.id)}>
                  <Button variant="ghost" size="sm" type="submit" className="text-destructive hover:text-destructive">
                    Delete
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
