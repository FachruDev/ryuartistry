import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-xl bg-paper p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
        <p className="display text-3xl text-ink">ryuartistry</p>
        <h1 className="mt-6 text-lg font-semibold">Masuk ke CMS</h1>
        <p className="mt-1 text-sm text-muted">Hanya untuk tim Ryuartistry.</p>
        <LoginForm />
      </div>
    </main>
  );
}
