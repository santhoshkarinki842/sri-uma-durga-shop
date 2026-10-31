import * as React from 'react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => onOpenChange?.(false)}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn('space-y-4', className)}>{children}</div>;
}

export function DialogHeader({ children }: { children?: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

export function DialogTitle({ children }: { children?: React.ReactNode }) {
  return <h2 className="font-heading text-xl font-bold">{children}</h2>;
}

export function DialogFooter({ children }: { children?: React.ReactNode }) {
  return <div className="flex justify-end gap-2 pt-2">{children}</div>;
}
