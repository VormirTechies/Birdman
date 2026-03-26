import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "w-full rounded-lg border-2 border-chennai-earth/30 bg-transparent px-4 py-3 text-base text-deep-night transition-colors outline-none placeholder:text-chennai-earth/50 focus:border-parakeet-green focus:ring-2 focus:ring-parakeet-green/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
