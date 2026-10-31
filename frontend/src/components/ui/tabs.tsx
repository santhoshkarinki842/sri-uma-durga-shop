import * as React from 'react';
import { cn } from '@/lib/utils';

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({ defaultValue, children }: { defaultValue: string; children?: React.ReactNode }) {
  const [value, setValue] = React.useState(defaultValue);
  return <TabsContext.Provider value={{ value, onValueChange: setValue }}>{children}</TabsContext.Provider>;
}

export function TabsList({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn('inline-flex rounded-xl border border-border bg-muted p-1', className)}>{children}</div>;
}

export function TabsTrigger({ value, className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string; children?: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  const active = ctx?.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx?.onValueChange(value)}
      className={cn('rounded-lg px-3 py-2 text-sm transition-colors', active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children?: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return <div className={cn(className)}>{children}</div>;
}
