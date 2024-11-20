"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus, X, Star, StarOff, Pencil, Trash2 } from "lucide-react"
import { useBusiness, type Business } from "@/contexts/business-context"
import { useWorkspace } from "@/contexts/workspace-context"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/empty-state"
import { Building2 } from "lucide-react"

interface BusinessManagementProps {
  showAddDialog: boolean;
  setShowAddDialog: (show: boolean) => void;
}

export function BusinessManagement({ showAddDialog, setShowAddDialog }: BusinessManagementProps) {
  const { currentWorkspace } = useWorkspace()
  const { businesses, addBusiness, updateBusiness, deleteBusiness, setDefaultBusiness, getWorkspaceBusinesses } = useBusiness()
  const [editBusiness, setEditBusiness] = useState<Business | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [showForm, setShowForm] = useState(false)

  const workspaceBusinesses = currentWorkspace 
    ? getWorkspaceBusinesses(currentWorkspace.id)
    : []

  console.log('Current workspace:', currentWorkspace?.id)
  console.log('All businesses:', businesses)
  console.log('Workspace businesses:', workspaceBusinesses)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setPreviewUrl(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentWorkspace) {
      toast({
        title: "Error",
        description: "No workspace selected",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const businessData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      taxNumber: formData.get('taxNumber') as string,
      postalCode: formData.get('postalCode') as string,
      logo: previewUrl || undefined,
      workspaceId: currentWorkspace.id,
      isDefault: workspaceBusinesses.length === 0,
    };

    try {
      if (editBusiness) {
        updateBusiness(editBusiness.id, {
          ...businessData,
          isDefault: editBusiness.isDefault,
        });
        toast({
          title: "Business updated",
          description: "Your business details have been updated.",
        });
      } else {
        addBusiness(businessData);
        toast({
          title: "Business added",
          description: "New business has been added to your workspace.",
        });
      }

      setShowForm(false);
      setEditBusiness(null);
      setPreviewUrl("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save business details",
        variant: "destructive"
      });
    }
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal"
                onClick={() => {
                  setShowForm(false);
                  setEditBusiness(null);
                  setPreviewUrl("");
                }}
              >
                Business Profiles
              </Button>
              <span className="mx-2">/</span>
              <span className="text-foreground">
                {editBusiness ? "Edit Business" : "New Business"}
              </span>
            </div>
            <h2 className="text-2xl font-semibold">
              {editBusiness ? "Edit Business Profile" : "Create New Business Profile"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {editBusiness 
                ? "Update your business details below"
                : "Fill in your business details to create a new profile"
              }
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={() => {
              setShowForm(false);
              setEditBusiness(null);
              setPreviewUrl("");
            }}
          >
            Back to List
          </Button>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Logo</Label>
              <div className="flex items-center gap-4 mt-2">
                {previewUrl ? (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    <Image
                      src={previewUrl}
                      alt="Logo preview"
                      fill
                      className="object-contain"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
                      onClick={() => setPreviewUrl("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="w-32 h-32 flex flex-col items-center justify-center border border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                    <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Add logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editBusiness?.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editBusiness?.email}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  name="address"
                  defaultValue={editBusiness?.address}
                  required
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={editBusiness?.phone}
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    defaultValue={editBusiness?.postalCode}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="taxNumber">Tax Number</Label>
                <Input
                  id="taxNumber"
                  name="taxNumber"
                  defaultValue={editBusiness?.taxNumber}
                />
              </div>

              <div>
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  name="registrationNumber"
                  defaultValue={editBusiness?.registrationNumber}
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  defaultValue={editBusiness?.website}
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={editBusiness?.notes}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditBusiness(null);
                  setPreviewUrl("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editBusiness ? "Update Business" : "Add Business"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  if (workspaceBusinesses.length === 0) {
    return (
      <>
        <EmptyState
          icon={Building2}
          title="No businesses yet"
          description="Add your first business profile to this workspace"
          action={{
            label: "Add Business",
            onClick: () => {
              setEditBusiness(null);
              setPreviewUrl("");
              setShowForm(true);
            }
          }}
        />
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Business Profiles</h2>
          <p className="text-sm text-muted-foreground">
            Manage business profiles in this workspace
          </p>
        </div>
        <Button onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setEditBusiness(null);
          setPreviewUrl("");
          setShowForm(true);
        }}>
          Add Business
        </Button>
      </div>

      <div className="grid gap-4">
        {workspaceBusinesses.map((business) => (
          <Card key={business.id} className="p-4">
            <div className="flex items-start gap-4">
              {business.logo ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                  <Image
                    src={business.logo}
                    alt={business.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border flex items-center justify-center bg-muted">
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{business.name}</h3>
                  {business.isDefault && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {business.email}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDefaultBusiness(business.id)}
                  disabled={business.isDefault}
                  title={business.isDefault ? "Default business" : "Set as default"}
                >
                  {business.isDefault ? (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditBusiness(business);
                    setPreviewUrl(business.logo || "");
                    setShowForm(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this business?')) {
                      try {
                        deleteBusiness(business.id);
                        toast({
                          title: "Business deleted",
                          description: "The business has been removed from your workspace.",
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to delete business",
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                  disabled={workspaceBusinesses.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 