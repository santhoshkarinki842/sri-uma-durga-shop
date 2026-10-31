import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Item } from "@/lib/types";

export interface CartLine {
  id: string;
  name: string;
  price: number;
  unit: string;
  image_url: string;
  qty: number;
}

interface CartCtx {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (item: Item) => void;
  setQty: (id: string, qty: number) => void;
  qtyOf: (id: string) => number;
  clear: () => void;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "sud_cart_v1";

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines]);

  const add = useCallback((item: Item) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === item.id);
      if (found) return prev.map((l) => (l.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { id: item.id, name: item.name, price: item.price, unit: item.unit, image_url: item.image_url, qty: 1 }];
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty } : l))));
  }, []);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal: lines.reduce((s, l) => s + l.qty * l.price, 0),
      add,
      setQty,
      qtyOf: (id) => lines.find((l) => l.id === id)?.qty ?? 0,
      clear: () => setLines([]),
    }),
    [lines, add, setQty],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react/only-export-components
export function useCart(): CartCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
