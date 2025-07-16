import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 border-black px-3 py-1 text-xs font-bold transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]",
  {
    variants: {
      variant: {
        default: "bg-gray-200 text-gray-900",
        secondary: "bg-gray-100 text-gray-900",
        destructive: "bg-red-200 text-red-900",
        success: "bg-green-200 text-green-900",
        warning: "bg-orange-200 text-orange-900",
        outline: "bg-white text-gray-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
