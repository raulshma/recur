import * as React from "react"
import { cn } from "@/lib/utils"

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  language?: string
}

const CodeBlock = React.forwardRef<HTMLPreElement, CodeBlockProps>(
  ({ className, language, children, ...props }, ref) => {
    return (
      <pre
        ref={ref}
        className={cn(
          "rounded-md bg-gray-900 dark:bg-gray-950 p-4 text-sm text-gray-100 dark:text-gray-200 overflow-x-auto border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          className,
        )}
        {...props}
      >
        <code className={language ? `language-${language}` : ""}>{children}</code>
      </pre>
    )
  },
)
CodeBlock.displayName = "CodeBlock"

export { CodeBlock }
