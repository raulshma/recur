

import { Toaster } from "sonner"

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "white",
          border: "2px solid black",
          boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
          borderRadius: "8px",
        },
      }}
      closeButton
      richColors
    />
  )
}
