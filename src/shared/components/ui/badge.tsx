import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@shared/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-border bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20',
        outline: 'border-border text-foreground',
        success: 'border-transparent bg-success/10 text-success ring-1 ring-inset ring-success/20',
        warning: 'border-transparent bg-warning/10 text-warning-foreground ring-1 ring-inset ring-warning/30',
        info: 'border-transparent bg-info/10 text-info ring-1 ring-inset ring-info/20',
        muted: 'border-transparent bg-muted text-muted-foreground',
        subtle: 'border-transparent bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-100',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
