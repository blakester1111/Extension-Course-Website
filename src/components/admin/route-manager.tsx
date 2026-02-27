'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createRoute, deleteRoute, updateRouteCourses } from '@/app/(dashboard)/admin/routes/actions'
import { toast } from 'sonner'
import { Plus, Trash2, GripVertical, Loader2, Route, X } from 'lucide-react'

interface RouteCourse {
  id: string
  courseId: string
  position: number
  title: string
  category: string
}

interface RouteData {
  id: string
  name: string
  description: string | null
  courses: RouteCourse[]
}

interface Props {
  routes: RouteData[]
  allCourses: { id: string; title: string; category: string }[]
}

export function RouteManager({ routes, allCourses }: Props) {
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  async function handleCreate() {
    if (!newName.trim()) {
      toast.error('Route name is required')
      return
    }
    setCreating(true)
    const result = await createRoute(newName, newDesc)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Route "${newName}" created`)
      setNewName('')
      setNewDesc('')
      router.refresh()
    }
    setCreating(false)
  }

  return (
    <div className="space-y-6">
      {/* Create new route */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />
            Create New Route
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="route-name">Route Name</Label>
              <Input
                id="route-name"
                placeholder="e.g. Chronological Route"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="route-desc">Description (optional)</Label>
              <Input
                id="route-desc"
                placeholder="Brief description"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing routes */}
      {routes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Route className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No study routes defined yet. Create one above.</p>
          </CardContent>
        </Card>
      ) : (
        routes.map(route => (
          <RouteEditor key={route.id} route={route} allCourses={allCourses} />
        ))
      )}
    </div>
  )
}

function RouteEditor({ route, allCourses }: { route: RouteData; allCourses: { id: string; title: string; category: string }[] }) {
  const [courses, setCourses] = useState(route.courses.map(c => c.courseId))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [addCourseId, setAddCourseId] = useState('')
  const router = useRouter()

  const hasChanges = JSON.stringify(courses) !== JSON.stringify(route.courses.map(c => c.courseId))

  // Courses not yet in the route
  const availableCourses = allCourses.filter(c => !courses.includes(c.id))

  function addCourse(courseId: string) {
    if (courseId && !courses.includes(courseId)) {
      setCourses([...courses, courseId])
      setAddCourseId('')
    }
  }

  function removeCourse(courseId: string) {
    setCourses(courses.filter(id => id !== courseId))
  }

  function moveCourse(idx: number, direction: -1 | 1) {
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= courses.length) return
    const updated = [...courses]
    ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
    setCourses(updated)
  }

  async function handleSave() {
    setSaving(true)
    const result = await updateRouteCourses(route.id, courses)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Route courses updated')
      router.refresh()
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete route "${route.name}"? This cannot be undone.`)) return
    setDeleting(true)
    const result = await deleteRoute(route.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Route "${route.name}" deleted`)
      router.refresh()
    }
    setDeleting(false)
  }

  const categoryColor = (cat: string) =>
    cat === 'basics' ? 'bg-blue-100 text-blue-700' :
    cat === 'congresses' ? 'bg-purple-100 text-purple-700' :
    'bg-amber-100 text-amber-700'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Route className="h-5 w-5" />
              {route.name}
            </CardTitle>
            {route.description && (
              <p className="text-sm text-muted-foreground mt-1">{route.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{courses.length} courses</Badge>
            <Button variant="ghost" size="icon" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Course list */}
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No courses in this route yet. Add courses below.</p>
        ) : (
          <div className="space-y-1">
            {courses.map((courseId, idx) => {
              const course = allCourses.find(c => c.id === courseId)
              if (!course) return null
              return (
                <div key={courseId} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 group">
                  <span className="text-xs font-mono text-muted-foreground w-6 text-right">{idx + 1}.</span>
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="flex-1 text-sm">{course.title}</span>
                  <Badge variant="secondary" className={`text-xs ${categoryColor(course.category)}`}>
                    {course.category === 'basics' ? 'B' : course.category === 'congresses' ? 'C' : 'A'}
                  </Badge>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveCourse(idx, -1)} disabled={idx === 0}>
                      <span className="text-xs">&#x25B2;</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveCourse(idx, 1)} disabled={idx === courses.length - 1}>
                      <span className="text-xs">&#x25BC;</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCourse(courseId)}>
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add course */}
        <div className="flex gap-2 pt-2 border-t">
          <Select value={addCourseId} onValueChange={addCourse}>
            <SelectTrigger className="flex-1 h-8 text-sm">
              <SelectValue placeholder="Add a course to this route..." />
            </SelectTrigger>
            <SelectContent>
              {availableCourses.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${categoryColor(c.category)}`}>
                      {c.category === 'basics' ? 'B' : c.category === 'congresses' ? 'C' : 'A'}
                    </Badge>
                    {c.title}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Save changes */}
        {hasChanges && (
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
