

import * as React from "react"
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface ImageGalleryImage {
  src: string
  alt: string
  caption?: string
}

interface ImageGalleryProps {
  images: ImageGalleryImage[]
  columns?: number
  thumbnailSize?: "sm" | "md" | "lg"
  className?: string
}

export function ImageGallery({ images, columns = 3, thumbnailSize = "md", className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)

  const thumbnailSizes = {
    sm: "h-24",
    md: "h-32",
    lg: "h-40",
  }

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
    setIsOpen(true)
  }

  const closeLightbox = () => {
    setIsOpen(false)
    setSelectedIndex(null)
  }

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "Escape":
          closeLightbox()
          break
        case "ArrowLeft":
          goToPrevious()
          break
        case "ArrowRight":
          goToNext()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, selectedIndex])

  return (
    <>
      <div className={cn("grid gap-4", `grid-cols-${columns}`, className)}>
        {images.map((image, index) => (
          <div
            key={index}
            className="group relative cursor-pointer overflow-hidden rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            onClick={() => openLightbox(index)}
          >
            <img
              src={image.src || "/placeholder.svg"}
              alt={image.alt}
              className={cn(
                "w-full object-cover transition-transform group-hover:scale-105",
                thumbnailSizes[thumbnailSize],
              )}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-2 border-white">
          {selectedIndex !== null && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-10 text-white hover:bg-white hover:text-black"
              >
                <X className="h-6 w-6" />
              </Button>

              {selectedIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white hover:text-black"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}

              {selectedIndex < images.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white hover:text-black"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              <img
                src={images[selectedIndex].src || "/placeholder.svg"}
                alt={images[selectedIndex].alt}
                className="w-full h-auto max-h-[80vh] object-contain"
              />

              {images[selectedIndex].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4">
                  <p className="text-center">{images[selectedIndex].caption}</p>
                </div>
              )}

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                {selectedIndex + 1} / {images.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
