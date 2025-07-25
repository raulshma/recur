import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border-2 border-black px-4 py-3 text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-950 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-gray-800 text-gray-950 dark:text-gray-50",
        destructive: "bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-300 [&>svg]:text-red-900 dark:[&>svg]:text-red-300",
        warning: "bg-orange-100 dark:bg-orange-900/20 text-orange-900 dark:text-orange-300 [&>svg]:text-orange-900 dark:[&>svg]:text-orange-300",
        success: "bg-green-100 dark:bg-green-900/20 text-green-900 dark:text-green-300 [&>svg]:text-green-900 dark:[&>svg]:text-green-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
  ),
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  ),
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
