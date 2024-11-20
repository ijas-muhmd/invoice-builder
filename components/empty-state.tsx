import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="bg-muted/50 p-4 rounded-full mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {description}
      </p>
      {action && (
        action.onClick ? (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        ) : (
          <Link href={action.href || "#"}>
            <Button>{action.label}</Button>
          </Link>
        )
      )}
    </div>
  )
} 