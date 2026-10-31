import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Phone, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { apiGet, apiPatch } from "@/lib/api";
import { PAYMENT_METHOD_LABELS, STATUS_BADGE, STATUS_LABELS, errMsg, fmtDateTime, inr } from "@/lib/format";
import type { Order, OrderStatus, OrderUpdate, PaymentMethod, PaymentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];
const PAY_STATUS_LABELS: Record<PaymentStatus, string> = { pending: "Pending", paid: "Paid" };
type Filter = "all" | OrderStatus;

function OrderRow({ order }: { order: Order }) {
  const qc = useQueryClient();
  const [note, setNote] = useState(order.admin_note);
  const update = useMutation({
    mutationFn: (body: OrderUpdate) => apiPatch<Order>(`/orders/${order.id}`, body),
    onSuccess: () => {
      toast.success(`Order ${order.order_number} updated`);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const tid = order.order_number;

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5" data-testid={`admin-order-${tid}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-lg font-bold">{order.order_number}</p>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_BADGE[order.status])} data-testid={`admin-order-status-badge-${tid}`}>
              {STATUS_LABELS[order.status]}
            </span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", order.payment_status === "paid" ? "bg-green-100 text-green-900" : "bg-rose-100 text-rose-900")}>
              {order.payment_status === "paid" ? "Paid" : "Unpaid"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{fmtDateTime(order.created_at)}</p>
        </div>
        <p className="font-heading text-2xl font-bold text-brand">{inr(order.total)}</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_18rem]">
        <div className="text-sm">
          <p className="font-semibold">{order.customer_name}</p>
          <a href={`tel:+91${order.phone}`} className="mt-1 flex items-center gap-1.5 text-brand" data-testid={`admin-order-call-${tid}`}><Phone className="size-3.5" /> {order.phone}</a>
          <p className="mt-1 flex gap-1.5 text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0" /> {order.address} · {order.distance_km} km</p>
        </div>
        <ul className="space-y-1 text-sm">
          {order.items.map((l) => (
            <li key={l.item_id} className="flex justify-between gap-2"><span>{l.name} ({l.unit}) × {l.qty}</span><span>{inr(l.line_total)}</span></li>
          ))}
          <li className="flex justify-between text-muted-foreground"><span>Delivery</span><span>{inr(order.delivery_fee)}</span></li>
          <li className="pt-1 text-xs text-muted-foreground">
            {PAYMENT_METHOD_LABELS[order.payment_method]}{order.transaction_id ? ` · Txn ${order.transaction_id}` : ""}
          </li>
        </ul>
        <div className="space-y-2">
          <Select value={order.status} onValueChange={(v: string) => update.mutate({ status: v as OrderStatus })}>
            <SelectTrigger className="h-10 w-full" data-testid={`admin-order-status-select-${tid}`}>
              <SelectValue>{(v) => STATUS_LABELS[v as OrderStatus]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} data-testid={`admin-status-option-${s}`}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Select value={order.payment_status} onValueChange={(v: string) => update.mutate({ payment_status: v as PaymentStatus })}>
              <SelectTrigger className="h-10 w-full" data-testid={`admin-order-payment-select-${tid}`}>
                <SelectValue>{(v) => PAY_STATUS_LABELS[v as PaymentStatus]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending" data-testid="admin-payment-option-pending">Pending</SelectItem>
                <SelectItem value="paid" data-testid="admin-payment-option-paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={order.payment_method} onValueChange={(v: string) => update.mutate({ payment_method: v as PaymentMethod })}>
              <SelectTrigger className="h-10 w-full" data-testid={`admin-order-method-select-${tid}`}>
                <SelectValue>{(v) => (v === "cod" ? "Cash" : "PhonePe")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phonepe">PhonePe</SelectItem>
                <SelectItem value="cod">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for customer" className="h-10" data-testid={`admin-order-note-input-${tid}`} />
            <button
              type="button"
              disabled={note === order.admin_note}
              onClick={() => update.mutate({ admin_note: note })}
              className="shrink-0 rounded-lg bg-ink px-3 text-sm font-medium text-white disabled:opacity-40"
              data-testid={`admin-order-note-save-${tid}`}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function OrdersPanel() {
  const [filter, setFilter] = useState<Filter>("all");
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => apiGet<Order[]>("/orders"),
    refetchInterval: 30_000,
  });
  const all = useMemo(() => orders.data ?? [], [orders.data]);
  const shown = filter === "all" ? all : all.filter((o) => o.status === filter);

  const stats = [
    { label: "New orders", value: all.filter((o) => o.status === "placed").length, testid: "stat-new" },
    { label: "In progress", value: all.filter((o) => o.status === "shipped" || o.status === "out_for_delivery").length, testid: "stat-progress" },
    { label: "Unpaid", value: all.filter((o) => o.payment_status === "pending" && o.status !== "cancelled").length, testid: "stat-unpaid" },
    { label: "Collected", value: inr(all.filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.total, 0)), testid: "stat-collected" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-heading text-2xl font-bold" data-testid={s.testid}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(["all", ...STATUSES] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors", filter === f ? "border-ink bg-ink text-white" : "border-border bg-white hover:bg-muted")}
            data-testid={`admin-orders-filter-${f}`}
          >
            {f === "all" ? "All" : STATUS_LABELS[f]}
          </button>
        ))}
        <button type="button" onClick={() => orders.refetch()} className="ml-auto flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-ink" data-testid="admin-orders-refresh">
          <RefreshCw className={cn("size-4", orders.isFetching && "animate-spin")} /> Refresh
        </button>
      </div>

      <div className="space-y-3" data-testid="admin-orders-list">
        {orders.isPending && <div className="h-40 animate-pulse rounded-2xl bg-muted" />}
        {orders.isError && <p className="text-rose-700">Could not load orders.</p>}
        {orders.isSuccess && shown.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground" data-testid="admin-orders-empty">No orders here yet.</p>
        )}
        {shown.map((o) => <OrderRow key={o.id} order={o} />)}
      </div>
    </div>
  );
}
