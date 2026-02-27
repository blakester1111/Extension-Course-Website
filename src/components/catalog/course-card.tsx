import Link from 'next/link'
import { Card, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, CheckCircle } from 'lucide-react'
import type { Course } from '@/types/database'

export function CourseCard({ course, isEnrolled = false }: { course: Course; isEnrolled?: boolean }) {
  return (
    <Card className="h-full hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <div className="bg-muted flex items-center justify-center p-4 h-[200px] relative">
        {isEnrolled && (
          <Badge className="absolute top-2 right-2 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Enrolled
          </Badge>
        )}
        {course.image_url ? (
          <img
            src={course.image_url}
            alt={course.title}
            className="max-w-[204px] max-h-[168px] w-auto h-auto object-contain"
          />
        ) : (
          <div className="w-full max-w-[204px] aspect-[204/160] flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardHeader className="pb-2 flex-1 px-3 sm:px-6">
        <h3 className="font-semibold text-sm leading-tight">{course.title}</h3>
      </CardHeader>
      <CardFooter className="flex items-center justify-center gap-3 pt-0 px-3 sm:px-6">
        {isEnrolled ? (
          <Button variant="outline" asChild>
            <Link href={`/student/courses/${course.id}`}>Go to Course</Link>
          </Button>
        ) : course.checkout_url ? (
          <Button variant="outline" asChild>
            <a href={course.checkout_url} target="_blank" rel="noopener noreferrer">Enroll</a>
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link href={`/catalog/${course.slug}`}>Enroll</Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href={`/catalog/${course.slug}`}>Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
