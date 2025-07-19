import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { formatCurrency, formatConvertedCurrency, getCurrencySymbol } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"
import { Badge } from "./badge"
import type { ConvertedAmount, CurrencyDisplayOptions } from "@/types"

const currencyDisplayVariants = cva(
  "inline-flex items-center gap-1 font-medium",
  {
    variants: {
      size: {
        sm: "text-sm",
        default: "text-base",
        lg: "text-lg",
        xl: "text-xl",
      },
      variant: {
        default: "text-gray-900 dark:text-gray-100",
        muted: "text-gray-600 dark:text-gray-400",
        success: "text-green-700 dark:text-green-400",
        warning: "text-orange-700 dark:text-orange-400",
        destructive: "text-red-700 dark:text-red-400",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
)

export interface CurrencyDisplayProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof currencyDisplayVariants> {
  /** The amount to display */
  amount: number
  /** The currency code (e.g., 'USD', 'EUR') */
  currency: string
  /** Optional converted amount data for multi-currency display */
  convertedAmount?: ConvertedAmount
  /** Display options for converted currency */
  displayOptions?: CurrencyDisplayOptions
  /** Whether to show a tooltip with additional information */
  showTooltip?: boolean
  /** Whether to show a stale rate indicator */
  showStaleIndicator?: boolean
  /** Custom tooltip content */
  tooltipContent?: React.ReactNode
}

const CurrencyDisplay = React.forwardRef<HTMLSpanElement, CurrencyDisplayProps>(
  ({
    className,
    size,
    variant,
    amount,
    currency,
    convertedAmount,
    displayOptions = {},
    showTooltip = true,
    showStaleIndicator = true,
    tooltipContent,
    ...props
  }, ref) => {
    // Determine what to display based on conversion data
    const displayText = React.useMemo(() => {
      if (convertedAmount) {
        return formatConvertedCurrency(convertedAmount, displayOptions)
      }
      return formatCurrency(amount, currency)
    }, [amount, currency, convertedAmount, displayOptions])

    // Generate tooltip content
    const defaultTooltipContent = React.useMemo(() => {
      if (!convertedAmount || convertedAmount.originalCurrency === convertedAmount.convertedCurrency) {
        return `${getCurrencySymbol(currency)} ${currency}`
      }

      const parts = []
      
      // Original amount
      parts.push(`Original: ${formatCurrency(convertedAmount.originalAmount, convertedAmount.originalCurrency)}`)
      
      // Converted amount
      parts.push(`Converted: ${formatCurrency(convertedAmount.convertedAmount, convertedAmount.convertedCurrency)}`)
      
      // Exchange rate
      parts.push(`Rate: 1 ${convertedAmount.originalCurrency} = ${convertedAmount.exchangeRate.toFixed(4)} ${convertedAmount.convertedCurrency}`)
      
      // Timestamp info
      if (convertedAmount.isStale) {
        const timeAgo = getTimeAgo(convertedAmount.timestamp)
        parts.push(`Rate from: ${timeAgo}`)
      } else {
        parts.push('Rate: Current')
      }

      return parts.join('\n')
    }, [currency, convertedAmount])

    const content = (
      <span
        ref={ref}
        className={cn(currencyDisplayVariants({ size, variant }), className)}
        {...props}
      >
        {displayText}
        {showStaleIndicator && convertedAmount?.isStale && (
          <Badge variant="warning" className="ml-1 text-xs">
            Stale
          </Badge>
        )}
      </span>
    )

    if (showTooltip && (tooltipContent || defaultTooltipContent)) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent className="max-w-xs whitespace-pre-line">
              {tooltipContent || defaultTooltipContent}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return content
  }
)

CurrencyDisplay.displayName = "CurrencyDisplay"

// Utility function to get time ago string (duplicated from utils to avoid circular import)
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

export { CurrencyDisplay, currencyDisplayVariants }