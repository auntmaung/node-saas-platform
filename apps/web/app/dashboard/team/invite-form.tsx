'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { inviteMemberAction } from '@/app/actions/tenant'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEffect, useRef } from 'react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Sending…' : 'Send invite'}
    </Button>
  )
}

export function InviteForm({ tenantId }: { tenantId: string }) {
  const [state, action] = useActionState(inviteMemberAction, null)
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
          Invite sent!
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="colleague@example.com" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          defaultValue="MEMBER"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <SubmitButton />
    </form>
  )
}
