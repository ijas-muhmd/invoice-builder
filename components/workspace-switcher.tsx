"use client"

import * as React from "react"
import { useWorkspace, type Workspace } from "@/contexts/workspace-context"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, PlusCircle, Settings, ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WorkspaceSettings } from "@/components/workspace-settings"
import Image from "next/image"

export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, addWorkspace, setCurrentWorkspace } = useWorkspace()
  const [open, setOpen] = React.useState(false)
  const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [newWorkspace, setNewWorkspace] = React.useState({
    name: "",
    logo: "",
    businessDetails: {
      name: "",
      email: "",
      address: "",
      phone: "",
      taxNumber: "",
      postalCode: "",
    }
  })

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !currentWorkspace) return null

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a workspace"
            className="w-full justify-between"
          >
            <Avatar className="mr-2 h-5 w-5">
              <AvatarImage
                src={currentWorkspace.logo || ''}
                alt={currentWorkspace.name}
              />
              <AvatarFallback>
                {currentWorkspace.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {currentWorkspace.name}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search workspace..." />
              <CommandEmpty>No workspace found.</CommandEmpty>
              <CommandGroup heading="Workspaces">
                {workspaces.map((workspace) => (
                  <CommandItem
                    key={workspace.id}
                    onSelect={() => {
                      setCurrentWorkspace(workspace.id)
                      setOpen(false)
                    }}
                    className="text-sm"
                  >
                    <Avatar className="mr-2 h-5 w-5">
                      <AvatarImage
                        src={workspace.logo || ''}
                        alt={workspace.name}
                      />
                      <AvatarFallback>
                        {workspace.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {workspace.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        currentWorkspace.id === workspace.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setShowNewWorkspaceDialog(true)
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Workspace
                </CommandItem>
                <WorkspaceSettings />
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showNewWorkspaceDialog} onOpenChange={setShowNewWorkspaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Add a new workspace to manage different business entities.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 pb-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <div className="flex items-center gap-4">
                {newWorkspace.logo ? (
                  <div className="relative w-16 h-16 border rounded-lg overflow-hidden">
                    <Image
                      src={newWorkspace.logo}
                      alt="Logo preview"
                      fill
                      className="object-contain"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
                      onClick={() => setNewWorkspace(prev => ({ ...prev, logo: "" }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="w-16 h-16 flex flex-col items-center justify-center border border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                    <ImagePlus className="h-6 w-6 text-muted-foreground mb-2" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            const base64String = reader.result as string
                            setNewWorkspace(prev => ({
                              ...prev,
                              logo: base64String
                            }))
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                placeholder="Acme Inc."
                value={newWorkspace.name}
                onChange={(e) => setNewWorkspace(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                placeholder="Legal business name"
                value={newWorkspace.businessDetails.name}
                onChange={(e) => setNewWorkspace(prev => ({
                  ...prev,
                  businessDetails: {
                    ...prev.businessDetails,
                    name: e.target.value
                  }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@acme.com"
                value={newWorkspace.businessDetails.email}
                onChange={(e) => setNewWorkspace(prev => ({
                  ...prev,
                  businessDetails: {
                    ...prev.businessDetails,
                    email: e.target.value
                  }
                }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewWorkspaceDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                addWorkspace(newWorkspace)
                setShowNewWorkspaceDialog(false)
                setNewWorkspace({
                  name: "",
                  logo: "",
                  businessDetails: {
                    name: "",
                    email: "",
                    address: "",
                    phone: "",
                    taxNumber: "",
                    postalCode: "",
                  }
                })
              }}
              disabled={!newWorkspace.name || !newWorkspace.businessDetails.name}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 