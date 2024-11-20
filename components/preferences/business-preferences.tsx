"use client"

import { BusinessManagement } from "@/components/preferences/business-management"
import { EmptyState } from "@/components/empty-state"
import { Building2 } from "lucide-react"
import { useBusiness } from "@/contexts/business-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { useState } from "react"

export function BusinessPreferences() {
  const { currentWorkspace } = useWorkspace()
  const { getWorkspaceBusinesses } = useBusiness()
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  const workspaceBusinesses = currentWorkspace 
    ? getWorkspaceBusinesses(currentWorkspace.id)
    : []

  const handleAddBusiness = () => {
    setShowAddDialog(true);
  };

  return (
    <>
      {workspaceBusinesses.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No businesses yet"
          description="Add your first business profile to this workspace"
          action={{
            label: "Add Business",
            onClick: handleAddBusiness
          }}
        />
      ) : (
        <BusinessManagement 
          showAddDialog={showAddDialog} 
          setShowAddDialog={setShowAddDialog} 
        />
      )}
    </>
  );
} 