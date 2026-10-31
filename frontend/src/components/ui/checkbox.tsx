import * as React from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, checked, onCheckedChange, onChange, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    checked={!!checked}
    onChange={(e) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    }}
    className={cn('h-4 w-4 rounded border border-input bg-background text-primary shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
    {...props}
  />
));
Checkbox.displayName = 'Checkbox';

export { Checkbox };
