import { Check, PackageCheck, Bike, Home, ClipboardList, XCircle } from "lucide-react";
import { STATUS_FLOW, STATUS_LABELS, fmtDateTime } from "@/lib/format";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS = [ClipboardList, PackageCheck, Bike, Home];

export default function OrderStepper({ order }: { order: Order }) {
  if (order.status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-rose-50 p-4 text-rose-800" data-testid="order-cancelled-banner">
        <XCircle className="size-6" /> This order was cancelled. Please call the shop for details.
      </div>
    );
  }
  const current = STATUS_FLOW.indexOf(order.status);
  const timeOf = (s: string) => order.status_history.find((e) => e.status === s)?.at;

  return (
    <ol className="grid grid-cols-4 gap-1" data-testid="order-stepper">
      {STATUS_FLOW.map((s, i) => {
        const done = i <= current;
        const Icon = done && i < current ? Check : ICONS[i];
        const t = timeOf(s);
        return (
          <li key={s} className="relative flex flex-col items-center text-center" data-testid={`order-step-${s}`} data-done={done}>
            {i > 0 && (
              <span
                className={cn(
                  "absolute top-5 right-1/2 h-1 w-full -translate-y-1/2 rounded-full transition-colors duration-500",
                  i <= current ? "bg-green-700" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-10 place-items-center rounded-full border-2 transition-colors duration-300",
                done ? "border-green-700 bg-green-700 text-white" : "border-border bg-white text-muted-foreground",
                i === current && "ring-4 ring-green-700/20",
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className={cn("mt-2 text-[11px] leading-tight font-semibold sm:text-sm", done ? "text-ink" : "text-muted-foreground")}>
              {STATUS_LABELS[s]}
            </span>
            {t && <span className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">{fmtDateTime(t)}</span>}
          </li>
        );
      })}
    </ol>
  );
}
