
import * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={true}
      richColors={true}
      closeButton={true}
      duration={5000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:min-h-[80px] group-[.toaster]:p-4 group-[.toaster]:text-base group-[.toaster]:font-medium",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm group-[.toast]:mt-1",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-semibold",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-semibold",
          success: "group-[.toast]:bg-gradient-to-r group-[.toast]:from-green-500 group-[.toast]:to-emerald-600 group-[.toast]:text-white group-[.toast]:border-green-400",
          error: "group-[.toast]:bg-gradient-to-r group-[.toast]:from-red-500 group-[.toast]:to-rose-600 group-[.toast]:text-white group-[.toast]:border-red-400",
          warning: "group-[.toast]:bg-gradient-to-r group-[.toast]:from-orange-500 group-[.toast]:to-amber-600 group-[.toast]:text-white group-[.toast]:border-orange-400",
          info: "group-[.toast]:bg-gradient-to-r group-[.toast]:from-blue-500 group-[.toast]:to-indigo-600 group-[.toast]:text-white group-[.toast]:border-blue-400",
        },
        duration: {
          success: 4000,
          error: 6000,
          warning: 5000,
          info: 4000,
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
