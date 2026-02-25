import { SignupForm } from '@/components/auth/signup-form'

export const metadata = {
  title: 'Sign Up — FCDC Extension Courses',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <SignupForm />
    </div>
  )
}
