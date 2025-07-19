

import * as React from "react"
import { X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface TagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  className?: string
}

export function TagInput({ tags, onTagsChange, placeholder = "Add tags...", maxTags, className }: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [isInputFocused, setIsInputFocused] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag) && (!maxTags || tags.length < maxTags)) {
      onTagsChange([...tags, trimmedTag])
      setInputValue("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const handleInputBlur = () => {
    setIsInputFocused(false)
    if (inputValue.trim()) {
      addTag(inputValue)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 p-3 border-2 border-black rounded-lg bg-white dark:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-within:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, index) => (
        <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
          {tag}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              removeTag(tag)
            }}
            className="h-4 w-4 p-0 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}

      {(!maxTags || tags.length < maxTags) && (
        <div className="flex items-center gap-2 flex-1 min-w-[120px]">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={handleInputBlur}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent"
          />
          {inputValue && (
            <Button variant="ghost" size="sm" onClick={() => addTag(inputValue)} className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {maxTags && (
        <span className="text-xs text-gray-500 ml-auto">
          {tags.length}/{maxTags}
        </span>
      )}
    </div>
  )
}
