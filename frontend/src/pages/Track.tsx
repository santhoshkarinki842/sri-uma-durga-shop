import { useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, PackageSearch, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import OrderStepper from "@/components/OrderStepper";
import PhonePeCard from "@/components/PhonePeCard";
import { apiGet } from "@/lib/api";
import { useSettings } from "@/lib/queries";
import { PAYMENT_METHOD_LABELS, STATUS_BADGE, STATUS_LABELS, errMsg, fmtDateTime, inr } from "@/lib/format";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LAST_PHONE_KEY } from "@/pages/Checkout";

function OrderCard({ order, highlight }: { order: Order; highlight?: boolean }) {
  const { settings } = useSettings();
  const paid = order.payment_status === "paid";
  return (
    <article
      className={cn("animate-float-in rounded-2xl border bg-card p-4 sm:p-6", highlight ? "border-brand shadow-lg" : "border-border")}
      data-testid={`order-card-${order.order_number}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order</p>
          <p className="font-heading text-2xl font-bold" data-testid="order-number">{order.order_number}</p>
          <p className="text-xs text-muted-foreground">{fmtDateTime(order.created_at)}</p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", STATUS_BADGE[order.status])} data-testid="order-status-badge">
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="mt-6"><OrderStepper order={order} /></div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-brand">Items</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {order.items.map((l) => (
              <li key={l.item_id} className="flex justify-between gap-2">
                <span>{l.name} <span className="text-muted-foreground">({l.unit}) × {l.qty}</span></span>
                <span className="font-medium">{inr(l.line_total)}</span>
              </li>
            ))}
            <li className="flex justify-between border-t border-border pt-1.5 text-muted-foreground"><span>Delivery ({order.distance_km} km)</span><span>{inr(order.delivery_fee)}</span></li>
            <li className="flex justify-between font-heading text-lg font-bold"><span>Total</span><span className="text-brand" data-testid="order-total">{inr(order.total)}</span></li>
          </ul>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-brand">Payment</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span>{PAYMENT_METHOD_LABELS[order.payment_method]}</span>
              <span
                className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", paid ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-900")}
                data-testid="order-payment-status"
              >
                {paid ? "Paid" : "Payment pending"}
              </span>
            </div>
            {order.transaction_id && <p className="mt-1 text-xs text-muted-foreground">Txn ID: {order.transaction_id}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-brand">Deliver to</p>
            <p className="mt-1 text-sm">{order.customer_name} · {order.phone}</p>
            <p className="text-sm text-muted-foreground">{order.address}</p>
          </div>
          {order.admin_note && <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground" data-testid="order-admin-note">Note from shop: {order.admin_note}</p>}
        </div>
      </div>

      {!paid && order.payment_method === "phonepe" && order.status !== "cancelled" && (
        <div className="mt-5"><PhonePeCard settings={settings} amount={order.total} /></div>
      )}
    </article>
  );
}

export default function Track() {
  const { orderNumber } = useParams();
  const [params] = useSearchParams();
  const isNew = params.get("new") === "1";
  const [input, setInput] = useState(() => params.get("phone") ?? localStorage.getItem(LAST_PHONE_KEY) ?? "");
  const [phone, setPhone] = useState(() => params.get("phone") ?? localStorage.getItem(LAST_PHONE_KEY) ?? "");

  const validPhone = /^[6-9]\d{9}$/.test(phone);
  const orders = useQuery({
    queryKey: ["my-orders", phone],
    queryFn: () => apiGet<Order[]>(`/orders/by-phone?phone=${phone}`),
    enabled: validPhone,
    refetchInterval: 30_000,
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setPhone(input);
    localStorage.setItem(LAST_PHONE_KEY, input);
  }

  const list = orders.data ?? [];
  const sorted = orderNumber ? [...list].sort((a) => (a.order_number === orderNumber ? -1 : 0)) : list;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:py-12">
      {isNew && orderNumber && (
        <div className="mb-6 flex animate-float-in items-center gap-3 rounded-2xl bg-green-700 p-4 text-white sm:p-5" data-testid="order-success-banner">
          <CheckCircle2 className="size-8 shrink-0" />
          <div>
            <p className="font-heading text-lg font-semibold">Thank you! Order {orderNumber} placed.</p>
            <p className="text-sm text-green-100">We will call you to confirm. Track live updates below.</p>
          </div>
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-wider text-amber-brand">Order updates</p>
      <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight">Track your order</h1>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-2 sm:flex-row" data-testid="track-form">
        <div className="relative flex-1">
          <Phone className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
            maxLength={10}
            inputMode="numeric"
            placeholder="Enter the mobile number used for ordering"
            className="h-12 bg-white pl-9"
            data-testid="track-phone-input"
          />
        </div>
        <button type="submit" className="h-12 rounded-xl bg-brand px-6 font-semibold text-white transition-transform duration-150 active:scale-95" data-testid="track-submit-button">
          Find my orders
        </button>
      </form>

      <div className="mt-8 space-y-5" data-testid="track-results">
        {orders.isFetching && !orders.data && (
          <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading orders…</p>
        )}
        {orders.isError && <p className="text-rose-700">{errMsg(orders.error, "Could not load orders. Please call the shop.")}</p>}
        {validPhone && orders.isSuccess && list.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-10 text-center" data-testid="track-empty-state">
            <PackageSearch className="size-10 text-muted-foreground" />
            <p className="mt-3 font-semibold">No orders found for {phone}</p>
            <Link to="/" className="mt-3 text-sm font-semibold text-brand underline">Start ordering</Link>
          </div>
        )}
        {!orders.isError && sorted.map((o) => <OrderCard key={o.id} order={o} highlight={o.order_number === orderNumber} />)}
      </div>
    </div>
  );
}
