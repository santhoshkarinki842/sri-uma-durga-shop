import { ApiError } from "@/lib/api";
import type { OrderStatus, PaymentMethod } from "@/lib/types";

export const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const prettyPhone = (p: string) => `+91 ${p.slice(0, 5)} ${p.slice(5)}`;

export const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Order Placed",
  shipped: "Packed & Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_FLOW: OrderStatus[] = ["placed", "shipped", "out_for_delivery", "delivered"];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  phonepe: "PhonePe / UPI",
  cod: "Cash on Delivery",
};

export const STATUS_BADGE: Record<OrderStatus, string> = {
  placed: "bg-amber-100 text-amber-900",
  shipped: "bg-sky-100 text-sky-900",
  out_for_delivery: "bg-orange-100 text-orange-900",
  delivered: "bg-green-100 text-green-900",
  cancelled: "bg-rose-100 text-rose-900",
};

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function errMsg(e: unknown, fallback = "Something went wrong"): string {
  if (e instanceof ApiError) {
    const body = e.body as { detail?: unknown } | null;
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail)) return "Please check the details you entered";
  }
  return fallback;
}

export const waLink = (phone: string, text: string) =>
  `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
