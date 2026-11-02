import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };
export const instant = false;

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-ink-deep px-4">
      <div className="w-full max-w-sm rounded-xl bg-paper p-8 ring-1 ring-line shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
        <p className="display text-3xl text-ink">ryuartistry</p>
        <h1 className="mt-6 text-lg font-semibold">Masuk ke CMS</h1>
        <p className="mt-1 text-sm text-muted">Hanya untuk tim Ryuartistry.</p>
        <LoginForm next={typeof next === "string" ? next : undefined} />
      </div>
    </main>
  );
}
