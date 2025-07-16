

import React from "react"
import { cn } from "@/lib/utils"

// Skip Link Component
interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50",
        "bg-white border-2 border-black px-4 py-2 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        "font-medium text-black no-underline focus:outline-none focus:ring-2 focus:ring-orange-500",
        className,
      )}
    >
      {children}
    </a>
  )
}

// Visually Hidden Component
interface VisuallyHiddenProps {
  children: React.ReactNode
  asChild?: boolean
}

export function VisuallyHidden({ children, asChild = false }: VisuallyHiddenProps) {
  const Component = asChild ? React.Fragment : "span"

  return <Component className="sr-only">{children}</Component>
}

// Focus Trap Component
interface FocusTrapProps {
  children: React.ReactNode
  enabled?: boolean
  className?: string
}

export function FocusTrap({ children, enabled = true, className }: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener("keydown", handleTabKey)
    firstElement?.focus()

    return () => {
      container.removeEventListener("keydown", handleTabKey)
    }
  }, [enabled])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

// Live Region for Announcements
interface AnnouncementProps {
  children: React.ReactNode
  priority?: "polite" | "assertive"
  className?: string
}

export function Announcement({ children, priority = "polite", className }: AnnouncementProps) {
  return (
    <div aria-live={priority} aria-atomic="true" className={cn("sr-only", className)}>
      {children}
    </div>
  )
}

// Keyboard Navigation Hook
export function useKeyboardNavigation(
  items: React.RefObject<HTMLElement>[],
  options: {
    loop?: boolean
    orientation?: "horizontal" | "vertical"
  } = {},
) {
  const { loop = true, orientation = "vertical" } = options
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      const isVertical = orientation === "vertical"
      const nextKey = isVertical ? "ArrowDown" : "ArrowRight"
      const prevKey = isVertical ? "ArrowUp" : "ArrowLeft"

      if (e.key === nextKey) {
        e.preventDefault()
        setCurrentIndex((prev) => {
          const next = prev + 1
          if (next >= items.length) {
            return loop ? 0 : prev
          }
          return next
        })
      } else if (e.key === prevKey) {
        e.preventDefault()
        setCurrentIndex((prev) => {
          const next = prev - 1
          if (next < 0) {
            return loop ? items.length - 1 : prev
          }
          return next
        })
      } else if (e.key === "Home") {
        e.preventDefault()
        setCurrentIndex(0)
      } else if (e.key === "End") {
        e.preventDefault()
        setCurrentIndex(items.length - 1)
      }
    },
    [items.length, loop, orientation],
  )

  React.useEffect(() => {
    const currentElement = items[currentIndex]?.current
    if (currentElement) {
      currentElement.focus()
    }
  }, [currentIndex, items])

  return { currentIndex, handleKeyDown }
}

// ARIA Describedby Hook
export function useAriaDescribedBy(description: string) {
  const id = React.useId()

  const describedByProps = React.useMemo(
    () => ({
      "aria-describedby": id,
    }),
    [id],
  )

  const descriptionProps = React.useMemo(
    () => ({
      id,
      children: description,
    }),
    [id, description],
  )

  return { describedByProps, descriptionProps }
}
