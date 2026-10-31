import { Link, NavLink, Outlet } from "react-router-dom";
import { MapPin, Phone, ShoppingBag, Truck, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useSettings } from "@/lib/queries";
import { prettyPhone, waLink } from "@/lib/format";
import { cn } from "@/lib/utils";

const navCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-200",
    isActive ? "bg-brand text-white" : "text-ink/80 hover:bg-accent",
  );

export default function PublicLayout() {
  const { count } = useCart();
  const { settings } = useSettings();

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* top strip */}
      <div className="bg-brand-dark text-[13px] text-[#EAD7C5]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 sm:px-6">
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <MapPin className="size-3.5 shrink-0 text-gold" />
            <span className="truncate" data-testid="header-address">{settings.address}</span>
          </span>
          <a href={`tel:+91${settings.phones[0]}`} className="hidden shrink-0 items-center gap-1 hover:text-white sm:flex" data-testid="header-call-link">
            <Phone className="size-3.5 text-gold" /> {prettyPhone(settings.phones[0] ?? "")}
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" data-testid="header-logo-link">
            <span className="grid size-10 place-items-center rounded-xl bg-brand font-heading text-lg font-bold text-white shadow-sm">
              SU
            </span>
            <span className="leading-tight whitespace-nowrap">
              <span className="block font-heading text-[15px] font-bold tracking-tight text-ink sm:text-lg">Sri Uma Durga</span>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-amber-brand">Sweets &amp; Hot</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/" end className={navCls} data-testid="nav-menu-link">Menu</NavLink>
            <NavLink to="/track" className={navCls} data-testid="nav-track-link">
              <span className="hidden sm:inline">Track Order</span>
              <span className="sm:hidden">Track</span>
            </NavLink>
            <Link
              to="/cart"
              data-testid="nav-cart-button"
              className="relative ml-1 flex items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
            >
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <span key={count} className="grid min-w-5 animate-pop place-items-center rounded-full bg-gold px-1 text-xs font-bold text-ink" data-testid="nav-cart-count">
                  {count}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 bg-brand-dark text-[#EAD7C5]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
          <div>
            <p className="font-heading text-2xl font-bold text-white">{settings.shop_name}</p>
            <p className="mt-2 max-w-xs text-sm">{settings.tagline}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">Call / PhonePe</p>
            {settings.phones.map((p) => (
              <a key={p} href={`tel:+91${p}`} className="flex items-center gap-2 hover:text-white" data-testid={`footer-phone-${p}`}>
                <Phone className="size-4" /> {prettyPhone(p)}
              </a>
            ))}
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">Visit us</p>
            <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" /> {settings.address}</p>
            <p className="flex items-center gap-2"><Truck className="size-4" /> Home delivery up to {settings.slabs.at(-1)?.max_km ?? 10} km &amp; beyond on big orders</p>
            <Link to="/admin" className="inline-block pt-2 text-xs text-[#EAD7C5]/60 hover:text-white" data-testid="footer-admin-link">Shop admin</Link>
          </div>
        </div>
        <p className="border-t border-white/10 py-4 text-center text-xs text-[#EAD7C5]/70">
          © {new Date().getFullYear()} {settings.shop_name}. Made with love in Katakoteswaram.
        </p>
      </footer>

      {/* Floating quick-order buttons */}
      <div className="fixed right-4 bottom-20 z-40 flex flex-col gap-3 sm:bottom-6">
        <a
          href={waLink(settings.whatsapp, `Hello ${settings.shop_name}, I would like to order:`)}
          target="_blank"
          rel="noreferrer"
          aria-label="Order on WhatsApp"
          data-testid="floating-whatsapp-button"
          className="grid size-13 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-110"
        >
          <MessageCircle className="size-6" />
        </a>
        <a
          href={`tel:+91${settings.phones[0]}`}
          aria-label="Call to order"
          data-testid="floating-call-button"
          className="grid size-13 place-items-center rounded-full bg-brand text-white shadow-lg transition-transform duration-200 hover:scale-110"
        >
          <Phone className="size-6" />
        </a>
      </div>
    </div>
  );
}
