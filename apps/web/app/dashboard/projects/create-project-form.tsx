'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createProjectAction } from '@/app/actions/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEffect, useRef } from 'react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating…' : 'Create project'}
    </Button>
  )
}

export function CreateProjectForm({ tenantId }: { tenantId: string }) {
  const [state, action] = useActionState(createProjectAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="tenantId" value={tenantId} />
      {state?.error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2">
          Project created!
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" placeholder="My project" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description <span className="text-muted-foreground">(optional)</span></Label>
        <Input id="description" name="description" placeholder="What is this project about?" />
      </div>
      <SubmitButton />
    </form>
  )
}
