import * as React from 'react'

/**
 * Visually hides content while keeping it accessible to screen readers
 * Useful for accessibility labels that should not be visible
 */
const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className = '', ...props }, ref) => (
  <span
    ref={ref}
    className="sr-only: absolute inline-block w-px h-px overflow-hidden whitespace-nowrap border-0"
    {...props}
  />
))

VisuallyHidden.displayName = 'VisuallyHidden'

export { VisuallyHidden }
