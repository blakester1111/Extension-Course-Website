'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Route, Award, CheckCircle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { completeOnboarding, updateProfileOnboarding } from '@/app/(dashboard)/onboarding/actions'
import type { UserRole } from '@/types/database'

interface WizardProps {
  role: UserRole
  fullName: string
  studyRoutes: { id: string; name: string }[]
  currentRouteId: string | null
  certMailPreference: string
  onComplete: () => void
}

export function WelcomeWizard({
  role,
  fullName,
  studyRoutes,
  currentRouteId,
  certMailPreference,
  onComplete,
}: WizardProps) {
  const isStudent = role === 'student'
  const isSupervisor = role === 'supervisor'

  const steps = buildSteps(role)
  const [step, setStep] = useState(0)
  const [name, setName] = useState(fullName)
  const [routeId, setRouteId] = useState(currentRouteId || 'none')
  const [certPref, setCertPref] = useState(certMailPreference || 'digital')
  const [saving, setSaving] = useState(false)

  const current = steps[step]
  const isLast = step === steps.length - 1

  async function handleNext() {
    // Save profile data on relevant steps
    if (current.id === 'profile') {
      setSaving(true)
      await updateProfileOnboarding({ fullName: name })
      setSaving(false)
    }
    if (current.id === 'route') {
      setSaving(true)
      await updateProfileOnboarding({ studyRouteId: routeId === 'none' ? null : routeId })
      setSaving(false)
    }
    if (current.id === 'certificate') {
      setSaving(true)
      await updateProfileOnboarding({ certMailPreference: certPref })
      setSaving(false)
    }

    if (isLast) {
      setSaving(true)
      await completeOnboarding()
      setSaving(false)
      onComplete()
    } else {
      setStep(step + 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-8 bg-primary' : i < step ? 'w-2 bg-primary/50' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <current.icon className="h-7 w-7 text-primary" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center mb-2">{current.title}</h2>
          <p className="text-muted-foreground text-center text-sm mb-6">{current.description}</p>

          {/* Step-specific content */}
          {current.id === 'profile' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="onboard-name">Your Full Name</Label>
                <Input
                  id="onboard-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
            </div>
          )}

          {current.id === 'route' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Your Study Route</Label>
                <Select value={routeId} onValueChange={setRouteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a route..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">I'll choose later</SelectItem>
                    {studyRoutes.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Your study route determines the recommended order of courses. You can change this anytime in your Profile.
                </p>
              </div>
            </div>
          )}

          {current.id === 'certificate' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Certificate Delivery Preference</Label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <input
                    type="radio"
                    name="certPref"
                    value="digital"
                    checked={certPref === 'digital'}
                    onChange={() => setCertPref('digital')}
                    className="accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium">Digital only</span>
                    <p className="text-xs text-muted-foreground">View and print certificates online anytime</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <input
                    type="radio"
                    name="certPref"
                    value="mail"
                    checked={certPref === 'mail'}
                    onChange={() => setCertPref('mail')}
                    className="accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium">Mail me a physical certificate</span>
                    <p className="text-xs text-muted-foreground">A printed certificate will be mailed after each course completion</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {current.id === 'welcome' && (
            <div className="space-y-3">
              {current.bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-sm">{bullet}</p>
                </div>
              ))}
            </div>
          )}

          {current.id === 'supervisor-overview' && (
            <div className="space-y-3">
              {current.bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-sm">{bullet}</p>
                </div>
              ))}
            </div>
          )}

          {current.id === 'admin-overview' && (
            <div className="space-y-3">
              {current.bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-sm">{bullet}</p>
                </div>
              ))}
            </div>
          )}

          {current.id === 'ready' && null}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-8 py-5 border-t bg-muted/30">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}
          <Button onClick={handleNext} disabled={saving}>
            {saving ? 'Saving...' : isLast ? 'Get Started' : 'Continue'}
            {!saving && !isLast && <ArrowRight className="h-4 w-4 ml-1" />}
            {!saving && isLast && <Sparkles className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface StepDef {
  id: string
  title: string
  description: string
  icon: React.ElementType
  bullets: string[]
}

function buildSteps(role: UserRole): StepDef[] {
  const steps: StepDef[] = []

  // Welcome step (all roles)
  if (role === 'student') {
    steps.push({
      id: 'welcome',
      title: 'Welcome to FCDC Extension Courses!',
      description: 'We\'re glad you\'re here. Here\'s what you can do:',
      icon: BookOpen,
      bullets: [
        'Study book and lecture extension courses at your own pace',
        'Submit lessons for grading by your supervisor',
        'Track your progress and earn certificates',
        'Climb the Honor Roll with weekly streaks',
      ],
    })
  } else if (role === 'supervisor') {
    steps.push({
      id: 'supervisor-overview',
      title: 'Welcome, Supervisor!',
      description: 'Here\'s an overview of your responsibilities:',
      icon: BookOpen,
      bullets: [
        'Grade lesson submissions from your assigned students',
        'Track student progress and send nudge emails when needed',
        'Verify staff invoice enrollments',
        'Access detailed activity and progress reports',
        'You can also take courses yourself under "My Learning"',
      ],
    })
  } else {
    steps.push({
      id: 'admin-overview',
      title: 'Welcome, Admin!',
      description: 'You have full control of the platform:',
      icon: BookOpen,
      bullets: [
        'Manage courses, lessons, and questions',
        'Assign roles, supervisors, and organizations to users',
        'Attest and issue certificates',
        'Define study routes for students',
        'Access all reports and revenue tracking',
        'You can also grade and take courses yourself',
      ],
    })
  }

  // Profile step (all roles)
  steps.push({
    id: 'profile',
    title: 'Confirm Your Name',
    description: 'Make sure your name is correct — it will appear on your certificates.',
    icon: CheckCircle,
    bullets: [],
  })

  // Route selection (all roles since they can be students too)
  steps.push({
    id: 'route',
    title: 'Choose a Study Route',
    description: 'A study route guides you through courses in a recommended order.',
    icon: Route,
    bullets: [],
  })

  // Certificate preference (all roles)
  steps.push({
    id: 'certificate',
    title: 'Certificate Delivery',
    description: 'How would you like to receive your course completion certificates?',
    icon: Award,
    bullets: [],
  })

  // Ready step
  steps.push({
    id: 'ready',
    title: 'You\'re All Set!',
    description: 'We\'ll now give you a quick tour of the site. Click "Get Started" to begin.',
    icon: Sparkles,
    bullets: [],
  })

  return steps
}
