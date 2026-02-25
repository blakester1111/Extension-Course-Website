import { BookOpen, PenLine, Send, CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'How It Works — FCDC Extension Course',
  description: 'Learn how the FCDC Extension Course works in four simple steps.',
}

const steps = [
  {
    icon: BookOpen,
    title: 'Browse',
    description:
      'Explore our catalog of book and lecture courses. Each course is broken into sequential lessons designed for self-paced study.',
  },
  {
    icon: PenLine,
    title: 'Study',
    description:
      'Work through each lesson at your own pace. Read the assigned materials and complete the lesson write-up based on the instructions provided.',
  },
  {
    icon: Send,
    title: 'Submit',
    description:
      'Submit your completed lesson for review. Your submission is sent directly to a qualified supervisor for grading.',
  },
  {
    icon: CheckCircle,
    title: 'Get Graded',
    description:
      'Receive detailed feedback from your supervisor. Once your lesson is approved, the next lesson unlocks automatically.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">How It Works</h1>
        <p className="text-muted-foreground mt-3">
          Complete your extension courses in four simple steps, all from the comfort of your home.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <div key={step.title} className="flex flex-col items-center text-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon className="h-8 w-8 text-primary" />
              </div>
              <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {index + 1}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="text-center pt-4">
        <p className="text-muted-foreground">
          Ready to get started?{' '}
          <a href="/catalog" className="text-primary font-medium hover:underline">
            Browse our courses
          </a>{' '}
          or{' '}
          <a href="/signup" className="text-primary font-medium hover:underline">
            create an account
          </a>{' '}
          today.
        </p>
      </div>
    </div>
  )
}
