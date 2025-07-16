

import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  showPrevNext?: boolean
  siblingCount?: number
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const generatePageNumbers = () => {
    const pages: (number | "ellipsis")[] = []

    // Always show first page
    if (showFirstLast) {
      pages.push(1)
    }

    // Calculate range around current page
    const startPage = Math.max(showFirstLast ? 2 : 1, currentPage - siblingCount)
    const endPage = Math.min(showFirstLast ? totalPages - 1 : totalPages, currentPage + siblingCount)

    // Add ellipsis after first page if needed
    if (showFirstLast && startPage > 2) {
      pages.push("ellipsis")
    }

    // Add pages around current page
    for (let i = startPage; i <= endPage; i++) {
      if (!showFirstLast || (i !== 1 && i !== totalPages)) {
        pages.push(i)
      }
    }

    // Add ellipsis before last page if needed
    if (showFirstLast && endPage < totalPages - 1) {
      pages.push("ellipsis")
    }

    // Always show last page
    if (showFirstLast && totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const pages = generatePageNumbers()

  return (
    <nav className={cn("flex items-center justify-center space-x-2", className)}>
      {/* Previous button */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="bg-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
      )}

      {/* Page numbers */}
      <div className="flex items-center space-x-1">
        {pages.map((page, index) => {
          if (page === "ellipsis") {
            return (
              <div key={`ellipsis-${index}`} className="px-3 py-2">
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </div>
            )
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={cn("min-w-[40px]", currentPage === page ? "bg-orange-500 hover:bg-orange-600" : "bg-white")}
            >
              {page}
            </Button>
          )
        })}
      </div>

      {/* Next button */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="bg-white"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </nav>
  )
}

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
  ),
)
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({ className, isActive, size = "icon", ...props }: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn("flex items-center justify-center", className)}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to previous page" size="default" className={cn("gap-1 pl-2.5", className)} {...props}>
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to next page" size="default" className={cn("gap-1 pr-2.5", className)} {...props}>
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export { PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious }
