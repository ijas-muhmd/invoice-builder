"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Download, Upload, Trash2 } from "lucide-react"
import { useWorkspace } from "@/contexts/workspace-context"
import { toast } from "@/components/ui/use-toast"
import { db } from "@/lib/db"
import { Separator } from "@/components/ui/separator"
import type { StoreName } from "@/lib/db"
import * as IDBExportImport from "indexeddb-export-import"

export function WorkspaceSettings() {
  const { currentWorkspace, updateWorkspace, deleteWorkspace, workspaces } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false)

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

  const handleDelete = async () => {
    if (!currentWorkspace) return

    try {
      // Delete all workspace data from IndexedDB
      const stores: StoreName[] = [
        'financial_transactions',
        'financial_expense_categories',
        'financial_income_categories',
        'businesses',
        'templates',
        'invoices',
        'drafts'
      ]

      for (const store of stores) {
        const items = await db.getAll(store)
        const workspaceItems = items.filter((item: any) => item.workspaceId === currentWorkspace.id)
        await Promise.all(workspaceItems.map((item: any) => db.delete(store, item.id)))
      }

      // Delete the workspace
      deleteWorkspace(currentWorkspace.id)
      
      toast({
        title: "Workspace deleted",
        description: "The workspace and all its data have been removed.",
      })
      setOpen(false)
    } catch (error) {
      console.error('Error deleting workspace:', error)
      toast({
        title: "Error",
        description: "Failed to delete workspace",
        variant: "destructive"
      })
    }
  }

  const handleExport = async () => {
    try {
      const data: Record<string, any[]> = {}
      const stores: StoreName[] = [
        'financial_transactions',
        'financial_expense_categories',
        'financial_income_categories',
        'businesses',
        'templates',
        'invoices',
        'drafts',
        'workspaces'
      ]

      for (const store of stores) {
        data[store] = await db.getAll(store)
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-builder-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Backup created",
        description: "Your data has been exported successfully.",
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      })
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Validate the backup data
      if (typeof data !== 'object') {
        throw new Error('Invalid backup file format')
      }

      // Import data for each store
      for (const [store, items] of Object.entries(data)) {
        if (Array.isArray(items)) {
          if (store === 'workspaces') {
            // Prevent duplicate workspaces
            const existing = await db.getAll('workspaces')
            const existingIds = new Set(existing.map((w: any) => w.id))
            const filtered = items.filter((item: any) => !existingIds.has(item.id))
            await Promise.all(filtered.map((item: any) => db.set('workspaces', item.id, item)))
          } else {
            await Promise.all(items.map((item: any) => db.set(store as StoreName, item.id, item)))
          }
        }
      }

      toast({
        title: "Data imported",
        description: "Your data has been restored successfully.",
      })
    } catch (error) {
      console.error('Error importing data:', error)
      toast({
        title: "Error",
        description: "Failed to import data",
        variant: "destructive"
      })
    }
  }

  const handleViewIndexedDB = async () => {
    try {
      const dbName = 'invoice-builder'
      const dbRequest = window.indexedDB.open(dbName)
      dbRequest.onsuccess = function(event) {
        const idb = dbRequest.result
        IDBExportImport.exportToJsonString(idb, (err: any, jsonString: string) => {
          if (err) {
            toast({
              title: "Error",
              description: "Failed to export IndexedDB",
              variant: "destructive"
            })
            return
          }
          // Open a new window/tab with the JSON data for inspection
          const blob = new Blob([jsonString], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          window.open(url, '_blank')
        })
      }
      dbRequest.onerror = function() {
        toast({
          title: "Error",
          description: "Failed to open IndexedDB",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to view IndexedDB",
        variant: "destructive"
      })
    }
  }

  const handleClearAllData = async () => {
    try {
      const dbName = 'invoice-builder'
      const dbRequest = window.indexedDB.open(dbName)
      dbRequest.onsuccess = function(event) {
        const idb = dbRequest.result
        const stores = Array.from(idb.objectStoreNames)
        const tx = idb.transaction(stores, 'readwrite')
        stores.forEach(store => {
          tx.objectStore(store).clear()
        })
        tx.oncomplete = function() {
          toast({
            title: "All data cleared",
            description: "All IndexedDB data has been removed. The app will now reload.",
          })
          setTimeout(() => window.location.reload(), 1000)
        }
        tx.onerror = function() {
          toast({
            title: "Error",
            description: "Failed to clear all data",
            variant: "destructive"
          })
        }
      }
      dbRequest.onerror = function() {
        toast({
          title: "Error",
          description: "Failed to open IndexedDB",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear all data",
        variant: "destructive"
      })
    }
    setShowClearAllConfirm(false)
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

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Data Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Export or import your workspace data
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('import-data')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleViewIndexedDB}
                  >
                    View IndexedDB
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowClearAllConfirm(true)}
                  >
                    Clear All Data
                  </Button>
                  <input
                    id="import-data"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImport}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                  <p className="text-sm text-muted-foreground">
                    Delete this workspace and all its data
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={workspaces.length === 1}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Workspace
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workspace? This action cannot be undone.
              All data associated with this workspace will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
            >
              Delete Workspace
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showClearAllConfirm} onOpenChange={setShowClearAllConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Data</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all data from IndexedDB? This will remove all workspaces, transactions, templates, and settings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowClearAllConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleClearAllData}
            >
              Clear All Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 