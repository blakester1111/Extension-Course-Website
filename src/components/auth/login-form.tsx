'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const supabase = createClient()

  // If already signed in, redirect to dashboard
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
      if (user) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
          .then(({ data: profile }: { data: any }) => {
            const role = profile?.role
            let dashboardRole: string
            if (role === 'super_admin' || role === 'admin') dashboardRole = 'admin'
            else if (role === 'supervisor') dashboardRole = 'supervisor'
            else dashboardRole = 'student'
            window.location.href = redirect || `/${dashboardRole}/dashboard`
          })
      }
    })
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setLoading(true)
    setError(null)

    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const signedInUser = signInData?.user
      if (signedInUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', signedInUser.id)
          .single()

        const role = profile?.role
        let dashboardRole: string
        if (role === 'super_admin' || role === 'admin') {
          dashboardRole = 'admin'
        } else if (role === 'supervisor') {
          dashboardRole = 'supervisor'
        } else {
          dashboardRole = 'student'
        }
        // Use window.location for a full page navigation to ensure
        // cookies are sent fresh and middleware processes correctly
        window.location.href = redirect || `/${dashboardRole}/dashboard`
      } else {
        setError('Sign in succeeded but failed to load user. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>Sign in to your FCDC Extension Course account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          <div className="flex flex-col items-center gap-2 text-sm">
            <Link href="/forgot-password" className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
              Forgot your password?
            </Link>
            <p className="text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline underline-offset-4">
                Sign up
              </Link>
            </p>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
