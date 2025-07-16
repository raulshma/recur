

import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingProps {
  value: number
  onChange?: (value: number) => void
  max?: number
  size?: "sm" | "md" | "lg"
  readonly?: boolean
  allowHalf?: boolean
  className?: string
}

export function Rating({
  value,
  onChange,
  max = 5,
  size = "md",
  readonly = false,
  allowHalf = false,
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null)

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const handleClick = (starValue: number) => {
    if (readonly || !onChange) return
    onChange(starValue)
  }

  const handleMouseEnter = (starValue: number) => {
    if (readonly) return
    setHoverValue(starValue)
  }

  const handleMouseLeave = () => {
    if (readonly) return
    setHoverValue(null)
  }

  const getStarFill = (starIndex: number) => {
    const currentValue = hoverValue ?? value
    const starValue = starIndex + 1

    if (allowHalf) {
      if (currentValue >= starValue) return "full"
      if (currentValue >= starValue - 0.5) return "half"
      return "empty"
    }

    return currentValue >= starValue ? "full" : "empty"
  }

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {Array.from({ length: max }, (_, index) => {
        const fill = getStarFill(index)
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index + 1)}
            onMouseEnter={() => handleMouseEnter(index + 1)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={cn(
              "relative transition-all",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default",
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                fill === "full" && "fill-orange-500 text-orange-500",
                fill === "empty" && "fill-gray-200 text-gray-300",
                fill === "half" && "fill-orange-500 text-orange-500",
              )}
            />
            {fill === "half" && (
              <Star
                className={cn(sizeClasses[size], "absolute inset-0 fill-gray-200 text-gray-300")}
                style={{ clipPath: "inset(0 50% 0 0)" }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
