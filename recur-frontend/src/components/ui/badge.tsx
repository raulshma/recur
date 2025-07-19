import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 border-black px-3 py-1 text-xs font-bold transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]",
  {
    variants: {
      variant: {
        default: "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100",
        secondary: "bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100",
        destructive: "bg-red-200 dark:bg-red-900/20 text-red-900 dark:text-red-300",
        success: "bg-green-200 dark:bg-green-900/20 text-green-900 dark:text-green-300",
        warning: "bg-orange-200 dark:bg-orange-900/20 text-orange-900 dark:text-orange-300",
        outline: "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
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
