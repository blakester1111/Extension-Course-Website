import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, GraduationCap, Trophy } from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'
import { Footer } from '@/components/layout/footer'
import { createClient } from '@/lib/supabase/server'
import { UserProvider } from '@/components/providers/user-provider'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <UserProvider initialUser={user} initialProfile={profile}>
    <div className="min-h-screen">
      <Topbar />

      <main>
        <section className="py-24 md:py-32">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center gap-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
              Gain{' '}
              <span className="underline decoration-primary decoration-[3px] underline-offset-4">
                Full
              </span>{' '}
              Conceptual Understanding of the Laws of Life with the Extension Course
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Complete your book and lecture courses from anywhere. Get personalized feedback from experienced supervisors and track your progress on the honor roll.
            </p>
            <div className="flex gap-4">
              <Button size="lg" asChild>
                <Link href="/catalog">Browse Courses</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/signup">Create Account</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/50">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center gap-4 p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Study at Your Pace</h3>
                <p className="text-muted-foreground">
                  Work through book and lecture courses on your own schedule with sequential lessons.
                </p>
              </div>
              <div className="flex flex-col items-center text-center gap-4 p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Expert Supervision</h3>
                <p className="text-muted-foreground">
                  Receive detailed feedback from qualified supervisors on every lesson submission.
                </p>
              </div>
              <div className="flex flex-col items-center text-center gap-4 p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Honor Roll</h3>
                <p className="text-muted-foreground">
                  Build weekly submission streaks and earn your place on the student honor roll.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
    </UserProvider>
  )
}
