

import type React from "react"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-950 group-[.toaster]:border-2 group-[.toaster]:border-black group-[.toaster]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-[.toaster]:rounded-md",
          description: "group-[.toast]:text-gray-600",
          actionButton:
            "group-[.toast]:bg-orange-500 group-[.toast]:text-white group-[.toast]:border-2 group-[.toast]:border-black group-[.toast]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-900 group-[.toast]:border-2 group-[.toast]:border-black group-[.toast]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
