

import * as React from "react"
import { Check, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  presetColors?: string[]
  className?: string
  disabled?: boolean
}

const defaultPresetColors = [
  "#FF6B35", // PostHog Orange
  "#000000", // Black
  "#FFFFFF", // White
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFA500", // Orange
  "#800080", // Purple
  "#FFC0CB", // Pink
  "#A52A2A", // Brown
  "#808080", // Gray
  "#000080", // Navy
  "#008000", // Dark Green
]

export function ColorPicker({
  value,
  onChange,
  presetColors = defaultPresetColors,
  className,
  disabled = false,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [customColor, setCustomColor] = React.useState(value)

  const handleColorSelect = (color: string) => {
    onChange(color)
    setCustomColor(color)
    setOpen(false)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    onChange(color)
  }

  const isValidHex = (color: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start bg-white dark:bg-gray-800", className)} disabled={disabled}>
          <div className="flex items-center space-x-2">
            <div
              className="h-4 w-4 rounded border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              style={{ backgroundColor: value }}
            />
            <span>{value}</span>
            <Palette className="ml-auto h-4 w-4" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <div className="space-y-4">
          {/* Preset Colors */}
          <div>
            <h4 className="font-bold text-sm mb-2">Preset Colors</h4>
            <div className="grid grid-cols-8 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={cn(
                    "h-8 w-8 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]",
                    value === color && "ring-2 ring-orange-500 ring-offset-2",
                  )}
                  style={{ backgroundColor: color }}
                >
                  {value === color && <Check className="h-4 w-4 text-white drop-shadow-lg" />}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Input */}
          <div>
            <h4 className="font-bold text-sm mb-2">Custom Color</h4>
            <div className="flex space-x-2">
              <Input
                type="text"
                value={customColor}
                onChange={handleCustomColorChange}
                placeholder="#FF6B35"
                className="flex-1"
              />
              <input
                type="color"
                value={isValidHex(customColor) ? customColor : "#FF6B35"}
                onChange={(e) => {
                  const color = e.target.value
                  setCustomColor(color)
                  onChange(color)
                }}
                className="w-12 h-10 border-2 border-black rounded cursor-pointer"
              />
            </div>
            {!isValidHex(customColor) && customColor && (
              <p className="text-xs text-red-600 mt-1">Invalid hex color format</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
