import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost, apiPut } from "@/lib/api";
import { useSettings } from "@/lib/queries";
import { errMsg } from "@/lib/format";
import type { ChangePasswordRequest, OkResponse, ShopSettings } from "@/lib/types";

const card = "space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6";

function SettingsForm({ initial }: { initial: ShopSettings }) {
  const qc = useQueryClient();
  const [s, setS] = useState<ShopSettings>(initial);
  const [phones, setPhones] = useState(initial.phones.join(", "));
  const [upis, setUpis] = useState(initial.upi_ids.join(", "));

  const save = useMutation({
    mutationFn: (body: ShopSettings) => apiPut<ShopSettings>("/settings", body),
    onSuccess: (data) => {
      qc.setQueryData(["settings"], data);
      setS(data);
      toast.success("Settings saved");
    },
    onError: (e) => toast.error(errMsg(e, "Could not save settings")),
  });

  const split = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean);
  const setSlab = (i: number, k: "max_km" | "fee", v: string) =>
    setS((p) => ({ ...p, slabs: p.slabs.map((sl, j) => (j === i ? { ...sl, [k]: Number(v) } : sl)) }));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (s.slabs.some((sl) => !(sl.max_km > 0) || sl.fee < 0)) return toast.error("Check the delivery slabs");
    save.mutate({ ...s, phones: split(phones), upi_ids: split(upis) });
  }

  return (
    <form onSubmit={submit} className="space-y-5" data-testid="settings-form">
      <section className={card}>
        <h2 className="font-heading text-xl font-bold">Delivery charges by distance</h2>
        <p className="text-sm text-muted-foreground">Each row: orders up to this many km pay this delivery fee.</p>
        <div className="space-y-2">
          {s.slabs.map((sl, i) => (
            <div key={i} className="flex items-end gap-2" data-testid={`settings-slab-${i}`}>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Up to (km)</Label>
                <Input type="number" min={0.1} step="0.1" value={sl.max_km} onChange={(e) => setSlab(i, "max_km", e.target.value)} data-testid={`settings-slab-km-${i}`} />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Fee (₹)</Label>
                <Input type="number" min={0} value={sl.fee} onChange={(e) => setSlab(i, "fee", e.target.value)} data-testid={`settings-slab-fee-${i}`} />
              </div>
              <button type="button" aria-label="Remove slab" disabled={s.slabs.length === 1} onClick={() => setS((p) => ({ ...p, slabs: p.slabs.filter((_, j) => j !== i) }))} className="grid size-9 place-items-center rounded-lg text-rose-700 hover:bg-rose-50 disabled:opacity-30" data-testid={`settings-slab-remove-${i}`}>
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setS((p) => ({ ...p, slabs: [...p.slabs, { max_km: (p.slabs.at(-1)?.max_km ?? 0) + 5, fee: (p.slabs.at(-1)?.fee ?? 0) + 20 }] }))} className="flex items-center gap-1 text-sm font-semibold text-brand" data-testid="settings-add-slab-button">
          <Plus className="size-4" /> Add slab
        </button>
        <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Beyond last slab: minimum order (₹)</Label>
            <Input type="number" min={0} value={s.far_min_order} onChange={(e) => setS({ ...s, far_min_order: Number(e.target.value) })} data-testid="settings-far-min-input" />
          </div>
          <div className="space-y-1">
            <Label>Beyond last slab: delivery fee (₹)</Label>
            <Input type="number" min={0} value={s.far_fee} onChange={(e) => setS({ ...s, far_fee: Number(e.target.value) })} data-testid="settings-far-fee-input" />
          </div>
        </div>
      </section>

      <section className={card}>
        <h2 className="font-heading text-xl font-bold">Shop details &amp; payment</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label>Shop name</Label><Input value={s.shop_name} onChange={(e) => setS({ ...s, shop_name: e.target.value })} data-testid="settings-shop-name-input" /></div>
          <div className="space-y-1"><Label>Tagline</Label><Input value={s.tagline} onChange={(e) => setS({ ...s, tagline: e.target.value })} data-testid="settings-tagline-input" /></div>
          <div className="space-y-1"><Label>Phone / PhonePe numbers (comma separated)</Label><Input value={phones} onChange={(e) => setPhones(e.target.value)} data-testid="settings-phones-input" /></div>
          <div className="space-y-1"><Label>WhatsApp number</Label><Input value={s.whatsapp} onChange={(e) => setS({ ...s, whatsapp: e.target.value })} data-testid="settings-whatsapp-input" /></div>
          <div className="space-y-1 sm:col-span-2"><Label>UPI IDs (comma separated, e.g. 9642278354@ybl)</Label><Input value={upis} onChange={(e) => setUpis(e.target.value)} placeholder="Add your PhonePe UPI IDs" data-testid="settings-upi-input" /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Address</Label><Input value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} data-testid="settings-address-input" /></div>
        </div>
      </section>

      <button type="submit" disabled={save.isPending} className="w-full rounded-xl bg-brand py-3 font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-8" data-testid="settings-save-button">
        Save settings
      </button>
    </form>
  );
}

function PasswordForm() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const change = useMutation({
    mutationFn: (body: ChangePasswordRequest) => apiPost<OkResponse>("/auth/change-password", body),
    onSuccess: () => {
      toast.success("Password changed");
      setCur("");
      setNext("");
    },
    onError: (e) => toast.error(errMsg(e, "Could not change password")),
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        change.mutate({ current_password: cur, new_password: next });
      }}
      className={card}
      data-testid="password-form"
    >
      <h2 className="font-heading text-xl font-bold">Change admin password</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><Label>Current password</Label><Input type="password" required value={cur} onChange={(e) => setCur(e.target.value)} data-testid="password-current-input" /></div>
        <div className="space-y-1"><Label>New password (min 6)</Label><Input type="password" required minLength={6} value={next} onChange={(e) => setNext(e.target.value)} data-testid="password-new-input" /></div>
      </div>
      <button type="submit" disabled={change.isPending} className="rounded-xl bg-ink px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60" data-testid="password-save-button">Update password</button>
    </form>
  );
}

export default function SettingsPanel() {
  const { data, isPending } = useSettings();
  return (
    <div className="space-y-5">
      {isPending ? <div className="h-40 animate-pulse rounded-2xl bg-muted" /> : data ? <SettingsForm initial={data} /> : <p>Could not load settings.</p>}
      <PasswordForm />
    </div>
  );
}
