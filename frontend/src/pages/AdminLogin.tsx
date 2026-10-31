import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/lib/api";
import { beginSession } from "@/lib/session";
import { errMsg } from "@/lib/format";
import type { AdminMe, LoginRequest } from "@/lib/types";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: (body: LoginRequest) => apiPost<AdminMe>("/auth/login", body),
    onSuccess: () => {
      beginSession();
      navigate("/admin/dashboard");
    },
    onError: (e) => toast.error(errMsg(e, "Login failed")),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    login.mutate({ username, password });
  }

  return (
    <div className="dark grid min-h-screen place-items-center bg-obsidian px-4 py-10 text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(217,119,6,0.18),transparent_45%),radial-gradient(circle_at_90%_90%,rgba(185,56,21,0.2),transparent_40%)]" />
      <div className="relative w-full max-w-sm animate-float-in">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" data-testid="admin-login-back-link">
          <ArrowLeft className="size-4" /> Back to shop
        </Link>
        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-card/80 p-6 shadow-2xl backdrop-blur sm:p-8" data-testid="admin-login-form">
          <span className="grid size-12 place-items-center rounded-2xl bg-amber-brand text-white"><ShieldCheck className="size-6" /></span>
          <h1 className="mt-4 font-heading text-2xl font-bold">Shop admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sri Uma Durga — manage items, prices &amp; orders</p>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="u">User ID</Label>
              <Input id="u" required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-11" data-testid="admin-login-username-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p">Password</Label>
              <Input id="p" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" data-testid="admin-login-password-input" />
            </div>
          </div>
          <button type="submit" disabled={login.isPending} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-brand py-3 font-semibold text-white transition-opacity duration-200 disabled:opacity-60" data-testid="admin-login-submit-button">
            {login.isPending && <Loader2 className="size-4 animate-spin" />} Log in
          </button>
        </form>
      </div>
    </div>
  );
}
