import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Banknote, Loader2, MapPin, Minus, Plus, ShoppingBag, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PhonePeCard from "@/components/PhonePeCard";
import { apiPost } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useSettings } from "@/lib/queries";
import { errMsg, inr } from "@/lib/format";
import type { Order, OrderCreate, PaymentMethod, QuoteRequest, QuoteResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

export const LAST_PHONE_KEY = "sud_last_phone";

export default function Checkout() {
  const { lines, subtotal, setQty, clear } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(() => localStorage.getItem(LAST_PHONE_KEY) ?? "");
  const [address, setAddress] = useState("");
  const [km, setKm] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("phonepe");
  const [txn, setTxn] = useState("");

  const distance = Number(km);
  const distanceValid = km.trim() !== "" && Number.isFinite(distance) && distance >= 0;

  const quote = useQuery({
    queryKey: ["quote", distance, subtotal],
    queryFn: () => apiPost<QuoteResponse>("/delivery/quote", { distance_km: distance, subtotal } satisfies QuoteRequest),
    enabled: distanceValid && lines.length > 0,
  });

  const place = useMutation({
    mutationFn: (body: OrderCreate) => apiPost<Order>("/orders", body),
    onSuccess: (order) => {
      localStorage.setItem(LAST_PHONE_KEY, order.phone);
      clear();
      toast.success(`Order ${order.order_number} placed!`);
      navigate(`/track/${order.order_number}?phone=${order.phone}&new=1`);
    },
    onError: (e) => toast.error(errMsg(e, "Could not place order")),
  });

  const fee = quote.data?.deliverable ? quote.data.delivery_fee : 0;
  const total = subtotal + fee;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) return toast.error("Enter a valid 10-digit mobile number");
    if (!distanceValid) return toast.error("Enter your distance from the shop in km");
    if (quote.data && !quote.data.deliverable) return toast.error(quote.data.message);
    place.mutate({
      customer_name: name,
      phone,
      address,
      distance_km: distance,
      payment_method: method,
      transaction_id: method === "phonepe" ? txn : "",
      items: lines.map((l) => ({ item_id: l.id, qty: l.qty })),
    });
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center" data-testid="cart-empty-state">
        <span className="grid size-20 place-items-center rounded-full bg-accent text-brand"><ShoppingBag className="size-9" /></span>
        <h1 className="mt-5 font-heading text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Add some sweets or hot snacks to get started.</p>
        <Link to="/" className="mt-6 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white" data-testid="cart-browse-menu-button">Browse menu</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:py-12 lg:grid-cols-[1fr_26rem]" data-testid="checkout-form">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-brand">Checkout</p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight">Your order</h1>
        </div>

        <section className="rounded-2xl border border-border bg-card p-2 sm:p-3" data-testid="cart-lines">
          {lines.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-xl p-2 sm:gap-4" data-testid={`cart-line-${l.id}`}>
              {l.image_url ? (
                <img src={l.image_url} alt="" className="size-14 shrink-0 rounded-xl object-cover sm:size-16" />
              ) : (
                <div className="size-14 shrink-0 rounded-xl bg-accent sm:size-16" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{l.name}</p>
                <p className="text-xs text-muted-foreground">{inr(l.price)} / {l.unit}</p>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
                <button type="button" aria-label="Decrease" onClick={() => setQty(l.id, l.qty - 1)} className="grid size-7 place-items-center rounded-full hover:bg-accent" data-testid={`cart-dec-${l.id}`}><Minus className="size-3.5" /></button>
                <span className="w-6 text-center text-sm font-bold" data-testid={`cart-qty-${l.id}`}>{l.qty}</span>
                <button type="button" aria-label="Increase" onClick={() => setQty(l.id, l.qty + 1)} className="grid size-7 place-items-center rounded-full hover:bg-accent" data-testid={`cart-inc-${l.id}`}><Plus className="size-3.5" /></button>
              </div>
              <p className="hidden w-20 text-right font-heading font-semibold sm:block">{inr(l.price * l.qty)}</p>
              <button type="button" aria-label="Remove" onClick={() => setQty(l.id, 0)} className="text-muted-foreground hover:text-destructive" data-testid={`cart-remove-${l.id}`}><Trash2 className="size-4" /></button>
            </div>
          ))}
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="font-heading text-xl font-semibold">Delivery details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className="h-11" data-testid="checkout-name-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile number</Label>
              <Input id="phone" required inputMode="numeric" maxLength={10} placeholder="10-digit number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className="h-11" data-testid="checkout-phone-input" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Full address &amp; landmark</Label>
            <Textarea id="address" required minLength={5} value={address} onChange={(e) => setAddress(e.target.value)} rows={3} data-testid="checkout-address-input" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="km" className="flex items-center gap-1.5"><MapPin className="size-4 text-brand" /> Distance from our shop (km)</Label>
            <Input id="km" required type="number" min={0} step="0.1" placeholder="e.g. 4" value={km} onChange={(e) => setKm(e.target.value)} className="h-11 sm:max-w-48" data-testid="checkout-distance-input" />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {settings.slabs.map((s, i) => (
                <span key={i} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {i ? settings.slabs[i - 1].max_km : 0}–{s.max_km} km: {inr(s.fee)}
                </span>
              ))}
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {settings.slabs.at(-1)?.max_km}+ km: {inr(settings.far_fee)} (min order {inr(settings.far_min_order)})
              </span>
            </div>
            {quote.data && (
              <p className={cn("rounded-lg px-3 py-2 text-sm", quote.data.deliverable ? "bg-green-50 text-green-800" : "bg-rose-50 text-rose-800")} data-testid="checkout-delivery-message">
                {quote.data.message}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="font-heading text-xl font-semibold">Payment</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["phonepe", "PhonePe / UPI", Smartphone],
              ["cod", "Cash on Delivery", Banknote],
            ] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMethod(key)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 p-4 text-left font-semibold transition-colors duration-200",
                  method === key ? "border-brand bg-accent" : "border-border hover:bg-muted",
                )}
                data-testid={`checkout-payment-${key}`}
                aria-pressed={method === key}
              >
                <Icon className="size-5 text-brand" /> {label}
              </button>
            ))}
          </div>
          {method === "phonepe" && (
            <div className="space-y-3">
              <PhonePeCard settings={settings} amount={total} />
              <div className="space-y-1.5">
                <Label htmlFor="txn">PhonePe transaction ID (optional — you can also pay on delivery)</Label>
                <Input id="txn" value={txn} onChange={(e) => setTxn(e.target.value)} className="h-11" placeholder="e.g. T2405…" data-testid="checkout-transaction-input" />
              </div>
            </div>
          )}
        </section>
      </div>

      {/* summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl bg-brand-dark p-5 text-[#FFF8F0] shadow-xl sm:p-6" data-testid="checkout-summary">
          <h2 className="font-heading text-xl font-semibold">Bill summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-[#EAD7C5]">Items subtotal</dt><dd data-testid="checkout-subtotal">{inr(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-[#EAD7C5]">Delivery {distanceValid ? `(${distance} km)` : ""}</dt>
              <dd data-testid="checkout-delivery-fee">{quote.data?.deliverable ? inr(fee) : "—"}</dd>
            </div>
            <div className="flex justify-between border-t border-white/15 pt-3 font-heading text-2xl font-bold">
              <dt>Total</dt><dd className="text-gold" data-testid="checkout-total">{inr(total)}</dd>
            </div>
          </dl>
          <button
            type="submit"
            disabled={place.isPending || (quote.data ? !quote.data.deliverable : false)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-brand py-3.5 font-semibold text-white transition-[transform,opacity] duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            data-testid="checkout-place-order-button"
          >
            {place.isPending && <Loader2 className="size-4 animate-spin" />} Place order
          </button>
          <p className="mt-3 text-center text-xs text-[#EAD7C5]">
            Prefer to talk? Call <a className="underline" href={`tel:+91${settings.phones[0]}`}>{settings.phones[0]}</a>
          </p>
        </div>
      </aside>
    </form>
  );
}
