

import * as React from "react"
import { Bold, Italic, Underline, List, ListOrdered, Quote, Code, Link } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder = "Start writing...", className }: RichTextEditorProps) {
  const [isFocused, setIsFocused] = React.useState(false)
  const editorRef = React.useRef<HTMLDivElement>(null)

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  return (
          <div className={cn("border-2 border-black rounded-lg bg-white dark:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]", className)}>
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b-2 border-black bg-gray-50 dark:bg-gray-700">
        <Button variant="ghost" size="sm" onClick={() => handleCommand("bold")} className="h-8 w-8 p-0">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleCommand("italic")} className="h-8 w-8 p-0">
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleCommand("underline")} className="h-8 w-8 p-0">
          <Underline className="h-4 w-4" />
        </Button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        <Button variant="ghost" size="sm" onClick={() => handleCommand("insertUnorderedList")} className="h-8 w-8 p-0">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleCommand("insertOrderedList")} className="h-8 w-8 p-0">
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCommand("formatBlock", "blockquote")}
          className="h-8 w-8 p-0"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleCommand("formatBlock", "pre")} className="h-8 w-8 p-0">
          <Code className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = prompt("Enter URL:")
            if (url) handleCommand("createLink", url)
          }}
          className="h-8 w-8 p-0"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "min-h-[200px] p-4 focus:outline-none",
          "prose prose-sm max-w-none",
                      !value && !isFocused && "text-gray-400 dark:text-gray-500",
        )}
        data-placeholder={placeholder}
        style={{}}
      />
    </div>
  )
}
