
import { Flag, Users, Percent, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FeatureFlag {
  id: string
  name: string
  description: string
  enabled: boolean
  rolloutPercentage: number
  userCount: number
  totalUsers: number
  environment: "development" | "staging" | "production"
  createdAt: Date
  lastModified: Date
}

interface FeatureFlagToggleProps {
  flag: FeatureFlag
  onToggle: (flagId: string, enabled: boolean) => void
  onEdit?: (flagId: string) => void
  className?: string
}

export function FeatureFlagToggle({ flag, onToggle, onEdit, className }: FeatureFlagToggleProps) {
  const getEnvironmentColor = (env: FeatureFlag["environment"]) => {
    switch (env) {
      case "production":
        return "destructive"
      case "staging":
        return "warning"
      case "development":
        return "secondary"
      default:
        return "default"
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card className={cn("transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-md bg-orange-100 border-2 border-black">
              <Flag className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{flag.name}</CardTitle>
              <CardDescription className="mt-1">{flag.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={getEnvironmentColor(flag.environment)}>{flag.environment}</Badge>
            <Switch checked={flag.enabled} onCheckedChange={(enabled) => onToggle(flag.id, enabled)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rollout Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Percent className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Rollout Progress</span>
            </div>
            <span className="font-bold">{flag.rolloutPercentage}%</span>
          </div>
          <Progress value={flag.rolloutPercentage} className="h-2" />
        </div>

        {/* User Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Users Affected</span>
          </div>
          <span className="font-bold">
            {flag.userCount.toLocaleString()} / {flag.totalUsers.toLocaleString()}
          </span>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <Calendar className="h-3 w-3" />
              <span>Created</span>
            </div>
            <span className="font-medium">{formatDate(flag.createdAt)}</span>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <Calendar className="h-3 w-3" />
              <span>Modified</span>
            </div>
            <span className="font-medium">{formatDate(flag.lastModified)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onEdit?.(flag.id)} className="flex-1">
            Edit Flag
          </Button>
          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
            View Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
