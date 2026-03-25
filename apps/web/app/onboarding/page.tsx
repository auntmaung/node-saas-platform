'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createTenantAction } from '@/app/actions/tenant'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating…' : 'Create workspace'}
    </Button>
  )
}

export default function OnboardingPage() {
  const [state, action] = useActionState(createTenantAction, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Create your workspace</CardTitle>
          <CardDescription>Give your team a name to get started</CardDescription>
        </CardHeader>
        <form action={action}>
          <CardContent className="space-y-4">
            {state?.error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {state.error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Workspace name</Label>
              <Input id="name" name="name" placeholder="Acme Corp" required minLength={2} />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
