import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        available: "bg-parakeet-green/10 text-parakeet-green border-parakeet-green/30",
        warning: "bg-sunset-gold/10 text-sunset-gold border-sunset-gold/30",
        full: "bg-error/10 text-error border-error/30",
        closed: "bg-chennai-earth/10 text-chennai-earth border-chennai-earth/30",
        default: "bg-parakeet-green/10 text-parakeet-green border-parakeet-green/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
