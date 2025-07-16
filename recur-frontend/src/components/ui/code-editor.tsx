

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CodeEditorProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  language?: string
  showLineNumbers?: boolean
  showCopyButton?: boolean
  readOnly?: boolean
}

export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  showLineNumbers = false,
  showCopyButton = false,
  readOnly = false,
  className,
  ...props
}: CodeEditorProps) {
  const [copied, setCopied] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const lines = value.split("\n")

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{language}</span>
        {showCopyButton && (
          <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 px-2 bg-white">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        )}
      </div>
      <div className="relative border-2 border-black rounded-lg bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex">
          {showLineNumbers && (
            <div className="flex-shrink-0 p-4 bg-gray-100 border-r-2 border-black text-sm text-gray-500 font-mono select-none">
              {lines.map((_, index) => (
                <div key={index} className="leading-6">
                  {index + 1}
                </div>
              ))}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            className={cn(
              "flex-1 p-4 bg-transparent font-mono text-sm resize-none focus:outline-none leading-6",
              "placeholder:text-gray-400",
              className,
            )}
            spellCheck={false}
            {...props}
          />
        </div>
      </div>
    </div>
  )
}
