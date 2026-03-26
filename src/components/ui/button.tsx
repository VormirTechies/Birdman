import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-parakeet-green focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-parakeet-green text-white hover:shadow-[0_0_20px_rgba(0,163,108,0.3)] hover:scale-[1.02] active:scale-100",
        secondary: "bg-sunset-gold text-white hover:shadow-[0_0_20px_rgba(255,140,0,0.3)] hover:scale-[1.02] active:scale-100",
        outline: "border-2 border-parakeet-green text-parakeet-green hover:bg-parakeet-green/10",
        ghost: "text-chennai-earth hover:bg-mist-white",
        destructive: "bg-error/10 text-error hover:bg-error/20 focus:ring-error",
        link: "text-parakeet-green underline-offset-4 hover:underline",
      },
      size: {
        sm: "px-4 py-2 text-sm min-h-[36px] [&_svg]:size-4",
        md: "px-6 py-3 text-base min-h-[44px] [&_svg]:size-5",
        lg: "px-8 py-4 text-lg min-h-[52px] [&_svg]:size-6",
        icon: "size-11 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
