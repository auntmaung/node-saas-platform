'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { registerAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating account…' : 'Create account'}
    </Button>
  )
}

export default function RegisterPage() {
  const [state, action] = useActionState(registerAction, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>Get started for free today</CardDescription>
        </CardHeader>

        <form action={action}>
          <CardContent className="space-y-4">
            {state?.error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {state.error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="name" name="name" type="text" placeholder="Your name" autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-muted-foreground">(min 8 chars)</span>
              </Label>
              <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <SubmitButton />
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
