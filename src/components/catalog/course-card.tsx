import Link from 'next/link'
import { Card, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import type { Course } from '@/types/database'

export function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="h-full hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <div className="bg-muted flex items-center justify-center p-4 h-[200px]">
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
        {course.checkout_url ? (
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
