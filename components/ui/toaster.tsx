"use client"

import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

const VARIANT_ICON = {
  default: null,
  destructive: XCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
} as const

export function Toaster() {
  const { toasts } = useToast()

  return (
    // 2.5s auto-dismiss — quick and unobtrusive, like the mobile toast, instead
    // of Radix's 5s default that felt like it lingered.
    <ToastProvider duration={2500}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon = VARIANT_ICON[(variant as keyof typeof VARIANT_ICON) ?? "default"]
        return (
          <Toast key={id} variant={variant} {...props}>
            {Icon && <Icon data-toast-icon className="w-5 h-5 shrink-0" />}
            <div className="grid gap-1 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
