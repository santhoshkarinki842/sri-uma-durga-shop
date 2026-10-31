import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiDelete, apiPost, apiPut } from "@/lib/api";
import { useItems } from "@/lib/queries";
import { errMsg, inr } from "@/lib/format";
import type { Category, Item, ItemBase, OkResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMPTY: ItemBase = { name: "", category: "sweets", description: "", price: 0, unit: "500 g", image_url: "", available: true };
const CAT_LABELS: Record<Category, string> = { sweets: "Sweets", hot: "Hot items" };

function ItemForm({ initial, onDone }: { initial: Item | null; onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ItemBase>(initial ?? EMPTY);
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const set = <K extends keyof ItemBase>(k: K, v: ItemBase[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: (body: ItemBase) => (initial ? apiPut<Item>(`/items/${initial.id}`, body) : apiPost<Item>("/items", body)),
    onSuccess: (it) => {
      toast.success(`${it.name} saved`);
      qc.invalidateQueries({ queryKey: ["items"] });
      onDone();
    },
    onError: (e) => toast.error(errMsg(e, "Could not save item")),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const p = Number(price);
    if (!(p > 0)) return toast.error("Enter a valid price");
    save.mutate({ ...form, price: p });
  }

  return (
    <form onSubmit={submit} className="space-y-3" data-testid="item-form">
      <div className="space-y-1.5">
        <Label htmlFor="iname">Item name</Label>
        <Input id="iname" required value={form.name} onChange={(e) => set("name", e.target.value)} data-testid="item-form-name-input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v: string) => set("category", v as Category)}>
            <SelectTrigger className="w-full" data-testid="item-form-category-select"><SelectValue>{(v) => CAT_LABELS[v as Category]}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="sweets" data-testid="item-form-category-sweets">Sweets</SelectItem>
              <SelectItem value="hot" data-testid="item-form-category-hot">Hot items</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iunit">Quantity / unit</Label>
          <Input id="iunit" required value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="500 g, 1 kg, 6 pcs" data-testid="item-form-unit-input" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="iprice">Price (₹)</Label>
        <Input id="iprice" required type="number" min={1} step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} data-testid="item-form-price-input" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="idesc">Description</Label>
        <Textarea id="idesc" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} data-testid="item-form-description-input" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="iimg">Photo link (optional)</Label>
        <Input id="iimg" value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://…" data-testid="item-form-image-input" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={form.available} onCheckedChange={(c) => set("available", c === true)} data-testid="item-form-available-checkbox" />
        Available for ordering (show on website)
      </label>
      <DialogFooter>
        <button type="submit" disabled={save.isPending} className="w-full rounded-xl bg-brand py-2.5 font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-6" data-testid="item-form-save-button">
          {initial ? "Save changes" : "Add item"}
        </button>
      </DialogFooter>
    </form>
  );
}

export default function ItemsPanel() {
  const qc = useQueryClient();
  const items = useItems();
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);

  const del = useMutation({
    mutationFn: (id: string) => apiDelete<OkResponse>(`/items/${id}`),
    onSuccess: () => {
      toast.success("Item deleted");
      qc.invalidateQueries({ queryKey: ["items"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  function openForm(it: Item | null) {
    setEditing(it);
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold">Menu items</h2>
          <p className="text-sm text-muted-foreground">{items.data?.length ?? 0} items · only you can add or change prices</p>
        </div>
        <button type="button" onClick={() => openForm(null)} className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95" data-testid="admin-add-item-button">
          <Plus className="size-4" /> Add item
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-testid="admin-items-list">
        {items.isPending && <div className="h-24 animate-pulse rounded-2xl bg-muted" />}
        {(items.data ?? []).map((it) => (
          <div key={it.id} className={cn("flex items-center gap-3 rounded-2xl border border-border bg-card p-3", !it.available && "opacity-60")} data-testid={`admin-item-${it.id}`}>
            {it.image_url ? <img src={it.image_url} alt="" className="size-16 shrink-0 rounded-xl object-cover" /> : <div className="size-16 shrink-0 rounded-xl bg-accent" />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold" data-testid="admin-item-name">{it.name}</p>
              <p className="text-xs text-muted-foreground">{CAT_LABELS[it.category]} · {it.unit}{it.available ? "" : " · Hidden"}</p>
              <p className="font-heading font-bold text-brand" data-testid="admin-item-price">{inr(it.price)}</p>
            </div>
            <button type="button" aria-label="Edit" onClick={() => openForm(it)} className="grid size-9 place-items-center rounded-lg hover:bg-muted" data-testid={`admin-item-edit-${it.id}`}><Pencil className="size-4" /></button>
            <button
              type="button"
              aria-label="Delete"
              onClick={() => window.confirm(`Delete ${it.name}?`) && del.mutate(it.id)}
              className="grid size-9 place-items-center rounded-lg text-rose-700 hover:bg-rose-50"
              data-testid={`admin-item-delete-${it.id}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? `Edit ${editing.name}` : "Add new item"}</DialogTitle></DialogHeader>
          {open && <ItemForm key={editing?.id ?? "new"} initial={editing} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
