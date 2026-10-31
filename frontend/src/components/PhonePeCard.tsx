import { Copy, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { prettyPhone } from "@/lib/format";
import type { ShopSettings } from "@/lib/types";

function copy(text: string) {
  navigator.clipboard?.writeText(text).then(
    () => toast.success(`Copied ${text}`),
    () => toast.error("Could not copy"),
  );
}

export default function PhonePeCard({ settings, amount }: { settings: ShopSettings; amount?: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-phonepe p-5 text-white shadow-md" data-testid="phonepe-card">
      <div className="absolute -top-10 -right-10 size-36 rounded-full bg-white/10" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <Smartphone className="size-5" />
          <p className="font-heading text-lg font-semibold">Pay with PhonePe / UPI</p>
        </div>
        <p className="mt-1 text-sm text-[#E9D5FF]">
          Send {amount ? <b className="text-white">₹{amount}</b> : "the order amount"} to any number below and enter the transaction ID.
        </p>
        <div className="mt-4 space-y-2">
          {settings.phones.map((p) => (
            <div key={p} className="flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2.5">
              <span className="font-heading text-base font-semibold tracking-wide">{prettyPhone(p)}</span>
              <button
                type="button"
                onClick={() => copy(p)}
                className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-phonepe transition-transform duration-150 active:scale-95"
                data-testid={`phonepe-copy-${p}`}
              >
                <Copy className="size-3.5" /> Copy
              </button>
            </div>
          ))}
          {settings.upi_ids.map((u) => (
            <div key={u} className="flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2.5">
              <span className="truncate text-sm">UPI: <b>{u}</b></span>
              <div className="flex shrink-0 gap-1.5">
                <a
                  href={`upi://pay?pa=${encodeURIComponent(u)}&pn=${encodeURIComponent(settings.shop_name)}${amount ? `&am=${amount}` : ""}&cu=INR`}
                  className="rounded-lg bg-gold px-2.5 py-1 text-xs font-semibold text-ink sm:hidden"
                  data-testid={`upi-pay-${u}`}
                >
                  Pay
                </a>
                <button
                  type="button"
                  onClick={() => copy(u)}
                  className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-phonepe"
                  data-testid={`upi-copy-${u}`}
                >
                  <Copy className="size-3.5" /> Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
