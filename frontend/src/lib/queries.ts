import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Item, ShopSettings } from "@/lib/types";

// Fallback so the shell (phones, address) renders even with no backend (static preview).
export const DEFAULT_SETTINGS: ShopSettings = {
  shop_name: "Sri Uma Durga Sweets & Hot",
  tagline: "Traditional Andhra sweets & crispy hot snacks, made fresh every day",
  phones: ["9642278354", "9640250842"],
  whatsapp: "9642278354",
  address: "Katakoteswaram, Nidadavolu Mandal, East Godavari District, Andhra Pradesh 534305",
  upi_ids: [],
  slabs: [
    { max_km: 3, fee: 20 },
    { max_km: 6, fee: 40 },
    { max_km: 10, fee: 60 },
  ],
  far_min_order: 2500,
  far_fee: 100,
};

export function useSettings() {
  const q = useQuery({ queryKey: ["settings"], queryFn: () => apiGet<ShopSettings>("/settings") });
  return { ...q, settings: q.data ?? DEFAULT_SETTINGS };
}

export function useItems() {
  return useQuery({ queryKey: ["items"], queryFn: () => apiGet<Item[]>("/items") });
}
