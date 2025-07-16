
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AvatarGroupUser {
  src?: string
  alt: string
  fallback: string
}

interface AvatarGroupProps {
  avatars: AvatarGroupUser[]
  maxVisible?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AvatarGroup({ avatars, maxVisible = 3, size = "md", className }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, maxVisible)
  const remainingCount = Math.max(0, avatars.length - maxVisible)

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  }

  const offsetClasses = {
    sm: "-ml-2",
    md: "-ml-3",
    lg: "-ml-4",
  }

  return (
    <div className={cn("flex items-center", className)}>
      {visibleAvatars.map((user, index) => (
        <Avatar
          key={index}
          className={cn(
            sizeClasses[size],
            "border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
            index > 0 && offsetClasses[size],
          )}
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <AvatarImage src={user.src || "/placeholder.svg"} alt={user.alt} />
          <AvatarFallback className="bg-orange-500 text-white font-bold">{user.fallback}</AvatarFallback>
        </Avatar>
      ))}

      {remainingCount > 0 && (
        <Avatar
          className={cn(
            sizeClasses[size],
            "border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-500",
            offsetClasses[size],
          )}
          style={{ zIndex: 0 }}
        >
          <AvatarFallback className="bg-gray-500 text-white font-bold">+{remainingCount}</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
