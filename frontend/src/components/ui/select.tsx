import * as React from 'react';
import { cn } from '@/lib/utils';

interface SelectContextValue {
  value: string;
  onValueChange?: (value: string) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

export function Select({ value, onValueChange, children }: { value?: string; onValueChange?: (value: string) => void; children?: React.ReactNode }) {
  return <SelectContext.Provider value={{ value: value ?? '', onValueChange }}>{children}</SelectContext.Provider>;
}

export function SelectTrigger({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) {
  const ctx = React.useContext(SelectContext);
  return (
    <button type="button" className={cn('flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 text-left text-sm', className)} {...props}>
      {typeof children === 'function' ? children(ctx?.value ?? '') : children}
    </button>
  );
}

export function SelectValue({ children }: { children?: ((value: string) => React.ReactNode) | React.ReactNode }) {
  const ctx = React.useContext(SelectContext);
  const value = ctx?.value ?? '';
  return <>{typeof children === 'function' ? children(value) : value}</>;
}

export function SelectContent({ children }: { children?: React.ReactNode }) {
  return <div className="mt-1 space-y-1 rounded-xl border border-border bg-card p-1 shadow-md">{children}</div>;
}

export function SelectItem({ value, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string; children?: React.ReactNode }) {
  const ctx = React.useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => ctx?.onValueChange?.(value)}
      className={cn('flex w-full items-center rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted', ctx?.value === value && 'bg-muted font-medium', props.className)}
      {...props}
    >
      {children}
    </button>
  );
}
