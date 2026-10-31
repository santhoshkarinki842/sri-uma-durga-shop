import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, LogOut, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrdersPanel from "@/components/admin/OrdersPanel";
import ItemsPanel from "@/components/admin/ItemsPanel";
import SettingsPanel from "@/components/admin/SettingsPanel";
import { ApiError, apiGet } from "@/lib/api";
import { endSession } from "@/lib/session";
import type { AdminMe } from "@/lib/types";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const me = useQuery({ queryKey: ["me"], queryFn: () => apiGet<AdminMe>("/auth/me"), retry: false });

  useEffect(() => {
    if (me.error instanceof ApiError && me.error.status === 401) navigate("/admin", { replace: true });
  }, [me.error, navigate]);

  return (
    <div className="min-h-screen bg-[#F7F2EA]">
      <header className="sticky top-0 z-30 bg-obsidian text-[#F5EFE6] shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-brand font-heading font-bold text-white">SU</span>
            <div className="leading-tight">
              <p className="font-heading font-semibold">Admin dashboard</p>
              <p className="text-xs text-[#A89F91]" data-testid="admin-username">{me.data ? `Logged in as ${me.data.username}` : "Checking session…"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[#A89F91] hover:text-white sm:flex" data-testid="admin-view-shop-link">
              <ExternalLink className="size-4" /> View shop
            </a>
            <button type="button" onClick={() => endSession("/admin")} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/20" data-testid="admin-logout-button">
              <LogOut className="size-4" /> <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
        {me.isPending ? (
          <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading…</p>
        ) : me.isError ? (
          <p className="text-muted-foreground" data-testid="admin-session-error">Session not available. Redirecting to login…</p>
        ) : (
          <Tabs defaultValue="orders">
            <TabsList className="h-11 w-full sm:w-auto" data-testid="admin-tabs">
              <TabsTrigger value="orders" className="px-4" data-testid="admin-tab-orders">Orders</TabsTrigger>
              <TabsTrigger value="items" className="px-4" data-testid="admin-tab-items">Items &amp; prices</TabsTrigger>
              <TabsTrigger value="settings" className="px-4" data-testid="admin-tab-settings">Delivery &amp; shop</TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="mt-5"><OrdersPanel /></TabsContent>
            <TabsContent value="items" className="mt-5"><ItemsPanel /></TabsContent>
            <TabsContent value="settings" className="mt-5"><SettingsPanel /></TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
