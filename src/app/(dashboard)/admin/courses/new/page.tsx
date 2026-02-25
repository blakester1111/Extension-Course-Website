import { CourseForm } from '@/components/admin/course-form'

export const metadata = {
  title: 'New Course — Admin',
}

export default function NewCoursePage() {
  return (
    <div className="max-w-2xl">
      <CourseForm />
    </div>
  )
}
