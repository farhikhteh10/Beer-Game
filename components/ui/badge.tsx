import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

const getBadgeVariants = (variant?: string) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap"

  const variantClasses = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-destructive text-white",
    outline: "text-foreground",
  }

  return cn(baseClasses, variantClasses[variant as keyof typeof variantClasses] || variantClasses.default)
}

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & {
  variant?: "default" | "secondary" | "destructive" | "outline"
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : "span"

  return <Comp className={cn(getBadgeVariants(variant), className)} {...props} />
}

export { Badge }
