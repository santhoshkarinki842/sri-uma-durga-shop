import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Minus, Phone, Plus, Search, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart";
import { useItems, useSettings } from "@/lib/queries";
import { inr, prettyPhone, waLink } from "@/lib/format";
import type { Category, Item } from "@/lib/types";
import { cn } from "@/lib/utils";

const HERO = "https://images.unsplash.com/photo-1758910536889-43ce7b3199fd?crop=entropy&cs=srgb&fm=jpg&q=75&w=1400";

type Filter = "all" | Category;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All items" },
  { key: "sweets", label: "Sweets" },
  { key: "hot", label: "Hot items" },
];

function ItemCard({ item, index }: { item: Item; index: number }) {
  const { add, setQty, qtyOf } = useCart();
  const qty = qtyOf(item.id);
  const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <article
      className="group flex animate-float-in flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
      data-testid={`item-card-${slug}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-accent">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid size-full place-items-center font-heading text-5xl font-bold text-brand/40">{item.name[0]}</div>
        )}
        <span
          className={cn(
            "absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
            item.category === "hot" ? "bg-brand text-white" : "bg-secondary text-secondary-foreground",
          )}
        >
          {item.category === "hot" ? <Flame className="size-3" /> : <Sparkles className="size-3" />}
          {item.category === "hot" ? "Hot" : "Sweet"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="font-heading text-base leading-snug font-semibold text-ink sm:text-lg" data-testid={`item-name-${slug}`}>{item.name}</h3>
        {item.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">{item.description}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="font-heading text-lg font-bold text-brand sm:text-xl" data-testid={`item-price-${slug}`}>{inr(item.price)}</p>
            <p className="text-[11px] text-muted-foreground sm:text-xs">per {item.unit}</p>
          </div>
          {qty === 0 ? (
            <button
              type="button"
              onClick={() => {
                add(item);
                toast.success(`${item.name} added to cart`);
              }}
              className="flex items-center gap-1 rounded-full bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-[#9c2f11] active:scale-95"
              data-testid={`item-add-${slug}`}
            >
              <Plus className="size-4" /> Add
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-ink p-1 text-white">
              <button type="button" aria-label="Decrease" onClick={() => setQty(item.id, qty - 1)} className="grid size-7 place-items-center rounded-full transition-colors hover:bg-white/15" data-testid={`item-dec-${slug}`}>
                <Minus className="size-3.5" />
              </button>
              <span className="w-5 text-center text-sm font-bold" data-testid={`item-qty-${slug}`}>{qty}</span>
              <button type="button" aria-label="Increase" onClick={() => setQty(item.id, qty + 1)} className="grid size-7 place-items-center rounded-full transition-colors hover:bg-white/15" data-testid={`item-inc-${slug}`}>
                <Plus className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const { settings } = useSettings();
  const items = useItems();
  const { count, subtotal } = useCart();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (items.data ?? []).filter(
      (i) => i.available && (filter === "all" || i.category === filter) && (!s || i.name.toLowerCase().includes(s)),
    );
  }, [items.data, filter, search]);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-dark text-[#FFF8F0]">
        <img src={HERO} alt="" className="absolute inset-0 size-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/90 to-brand-dark/40" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div className="animate-float-in">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Katakoteswaram · Nidadavolu</p>
            <h1 className="mt-3 font-heading text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl lg:text-6xl" data-testid="hero-title">
              {settings.shop_name}
            </h1>
            <p className="mt-4 max-w-lg text-base text-[#EAD7C5] sm:text-lg">{settings.tagline}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#menu" className="rounded-full bg-amber-brand px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5" data-testid="hero-order-now-button">
                Order now
              </a>
              <a href={`tel:+91${settings.phones[0]}`} className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur transition-colors duration-200 hover:bg-white/20" data-testid="hero-call-button">
                <Phone className="size-4" /> Call to order
              </a>
            </div>
          </div>

          <div className="animate-float-in rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md [animation-delay:150ms] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">Order by phone</p>
            <div className="mt-3 space-y-2">
              {settings.phones.map((p) => (
                <div key={p} className="flex items-center justify-between gap-2 rounded-2xl bg-white/10 px-4 py-3">
                  <span className="font-heading text-base font-semibold whitespace-nowrap sm:text-lg">{prettyPhone(p)}</span>                  <div className="flex gap-2">
                    <a href={`tel:+91${p}`} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-dark" data-testid={`hero-call-${p}`}>Call</a>
                    <a href={waLink(p, "Hello, I would like to order:")} target="_blank" rel="noreferrer" className="rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white" data-testid={`hero-whatsapp-${p}`}>WhatsApp</a>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-2 text-sm text-[#EAD7C5]">
              <Truck className="mt-0.5 size-4 shrink-0 text-gold" />
              <p>
                Delivery {settings.slabs.map((s, i) => `${i ? settings.slabs[i - 1].max_km : 0}–${s.max_km} km ₹${s.fee}`).join(" · ")}. Above{" "}                {settings.slabs.at(-1)?.max_km} km on orders of {inr(settings.far_min_order)}+.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MENU */}
      <section id="menu" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-10 sm:px-6 md:pt-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-brand">Our menu</p>
            <h2 className="mt-1 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">Fresh sweets &amp; hot snacks</h2>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items…" className="h-11 rounded-full bg-white pl-9" data-testid="menu-search-input" />
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200",
                filter === f.key ? "border-brand bg-brand text-white" : "border-border bg-white text-ink hover:bg-accent",
              )}
              data-testid={`menu-filter-${f.key}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4" data-testid="menu-grid">
          {items.isPending &&
            Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />)}
          {visible.map((item, i) => (
            <ItemCard key={item.id} item={item} index={i} />
          ))}
        </div>
        {!items.isPending && visible.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground" data-testid="menu-empty-state">
            {items.isError ? "Menu is loading slowly — please call us to order." : "No items found."}
          </div>
        )}
      </section>

      {/* sticky cart bar (mobile + desktop) */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-3 sm:bottom-4 sm:left-1/2 sm:w-[28rem] sm:-translate-x-1/2 sm:p-0">
          <Link
            to="/cart"
            className="flex animate-float-in items-center justify-between rounded-2xl bg-ink px-5 py-3.5 text-white shadow-2xl transition-transform duration-200 hover:-translate-y-0.5"
            data-testid="sticky-cart-bar"
          >
            <span className="flex items-center gap-2 text-sm">
              <ShoppingBag className="size-5 text-gold" /> {count} item{count > 1 ? "s" : ""} · <b>{inr(subtotal)}</b>
            </span>
            <span className="text-sm font-semibold text-gold">Checkout →</span>
          </Link>
        </div>
      )}
    </div>
  );
}
