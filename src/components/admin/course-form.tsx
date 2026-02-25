'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createCourse, updateCourse, uploadCourseImage } from '@/app/(dashboard)/admin/courses/actions'
import type { Course, CourseCategory } from '@/types/database'

interface CourseFormProps {
  course?: Course
}

export function CourseForm({ course }: CourseFormProps) {
  const [imageUrl, setImageUrl] = useState(course?.image_url || '')
  const [uploading, setUploading] = useState(false)
  const [isPublished, setIsPublished] = useState(course?.is_published || false)
  const [category, setCategory] = useState<CourseCategory>(course?.category || 'basics')
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.set('file', file)

    const result = await uploadCourseImage(formData)
    if (result.error) {
      setError(result.error)
    } else if (result.url) {
      setImageUrl(result.url)
    }
    setUploading(false)
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async function handleSubmit(formData: FormData) {
    formData.set('is_published', String(isPublished))
    formData.set('category', category)
    formData.set('image_url', imageUrl)

    const result = course
      ? await updateCourse(course.id, formData)
      : await createCourse(formData)

    if (result?.error) {
      const errorMessages = typeof result.error === 'object'
        ? Object.values(result.error).flat().join(', ')
        : result.error
      setError(String(errorMessages))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{course ? 'Edit Course' : 'Create Course'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={course?.title}
                required
                onChange={(e) => {
                  if (!course) {
                    const slugInput = formRef.current?.querySelector<HTMLInputElement>('[name="slug"]')
                    if (slugInput) slugInput.value = generateSlug(e.target.value)
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={course?.slug}
                required
                pattern="[a-z0-9-]+"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={course?.description}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                defaultValue={course ? course.price_cents / 100 : 0}
                min={0}
                step={1}
              />
              <p className="text-xs text-muted-foreground">Enter price in dollars. Use 0 for free courses.</p>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as CourseCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basics">Basics</SelectItem>
                  <SelectItem value="congresses">Congresses</SelectItem>
                  <SelectItem value="accs">ACCs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkout_url">Square Checkout URL</Label>
            <Input
              id="checkout_url"
              name="checkout_url"
              defaultValue={course?.checkout_url || ''}
              placeholder="https://square.link/u/..."
            />
            <p className="text-xs text-muted-foreground">
              Paste the Square checkout or payment link for this course. Leave blank for free courses.
            </p>
            {course && (
              <div className="bg-muted p-3 rounded-md mt-2 space-y-1">
                <p className="text-xs font-medium">Square Redirect URL (set this in your Square checkout link settings):</p>
                <code className="text-xs block break-all select-all bg-background px-2 py-1 rounded border">
                  {typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL}/enroll/confirm?course={course.id}
                </code>
                <p className="text-xs text-muted-foreground">
                  This auto-enrolls the student after they complete payment on Square.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Course Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
            {imageUrl && (
              <img src={imageUrl} alt="Course preview" className="mt-2 h-32 w-auto rounded-md object-cover" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <Label htmlFor="is_published">Published</Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit">{course ? 'Update Course' : 'Create Course'}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
