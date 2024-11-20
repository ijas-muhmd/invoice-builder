"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings } from "lucide-react"
import { useWorkspace } from "@/contexts/workspace-context"
import { toast } from "@/components/ui/use-toast"

export function WorkspaceSettings() {
  const { currentWorkspace, updateWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentWorkspace) return

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    
    updateWorkspace(currentWorkspace.id, { name })

    toast({
      title: "Workspace updated",
      description: "Your workspace settings have been saved.",
    })
    setOpen(false)
  }

  if (!currentWorkspace) return null

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setOpen(true)}
        className="w-full justify-start"
      >
        <Settings className="mr-2 h-4 w-4" />
        Workspace Settings
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workspace Settings</DialogTitle>
            <DialogDescription>
              Manage your workspace settings
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={currentWorkspace.name}
                required
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
} 