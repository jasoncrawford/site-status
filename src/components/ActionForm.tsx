"use client"

import { useErrorDialog } from "@/components/ErrorDialog"

export default function ActionForm({
  action,
  children,
  ...props
}: {
  action: (formData: FormData) => Promise<{ error: string } | undefined>
  children: React.ReactNode
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, "action">) {
  const { showError } = useErrorDialog()

  return (
    <form
      {...props}
      action={async (formData) => {
        const result = await action(formData)
        if (result?.error) showError(result.error)
      }}
    >
      {children}
    </form>
  )
}
