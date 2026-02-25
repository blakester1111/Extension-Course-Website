'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { sendInviteEmail } from './actions'

export default function InvitePage() {
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setPending(true)

    const formData = new FormData(form)
    const result = await sendInviteEmail(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Invitation sent! Your friend will receive an email shortly.')
      form.reset()
    }
    setPending(false)
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="flex justify-center mb-4">
          <UserPlus className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Invite a Friend</h1>
        <p className="text-muted-foreground mt-3">
          Know someone who would benefit from extension courses? Send them an invitation to join the FCDC Extension Course platform.
        </p>
      </div>

      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Send an Invitation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="yourName">Your Name</Label>
              <Input id="yourName" name="yourName" required placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="friendName">Friend&apos;s Name</Label>
              <Input id="friendName" name="friendName" required placeholder="Friend's name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="friendEmail">Friend&apos;s Email</Label>
              <Input
                id="friendEmail"
                name="friendEmail"
                type="email"
                required
                placeholder="friend@example.com"
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
