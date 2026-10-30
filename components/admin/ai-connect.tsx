"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Key } from "@phosphor-icons/react";
import { createApiToken, type TokenState } from "@/lib/actions/ai";
import { connectCommands } from "@/lib/ai/connect";
import { FormMessage, Input, SubmitButton } from "./ui";

export function CopyButton({ value, label = "Salin" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-paper-raised px-2.5 py-1 text-xs font-semibold text-ink/80 transition-colors hover:border-ink/30 hover:text-ink"
    >
      {copied ? <Check size={14} weight="bold" className="text-success" /> : <Copy size={14} />}
      {copied ? "Tersalin" : label}
    </button>
  );
}

export function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-ink-deep">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
        <span className="text-xs font-semibold text-paper/70">{title}</span>
        <CopyButton value={code} />
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-relaxed text-paper">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Creates a token and shows it exactly once, together with ready-to-paste setup commands. */
export function TokenCreator({ endpoint, canManage }: { endpoint: string; canManage: boolean }) {
  const [state, action] = useActionState<TokenState, FormData>(createApiToken, {});

  if (!canManage) {
    return <p className="text-sm text-muted">Hanya admin yang bisa membuat token akses AI.</p>;
  }

  if (state.token) {
    const cmd = connectCommands(endpoint, state.token);
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm">
          <p className="font-semibold text-success">Token “{state.name}” dibuat.</p>
          <p className="mt-1 text-ink/80">Salin sekarang. Demi keamanan, token ini tidak akan ditampilkan lagi.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2.5">
          <Key size={16} className="shrink-0 text-muted" />
          <code className="min-w-0 flex-1 truncate text-sm">{state.token}</code>
          <CopyButton value={state.token} label="Salin token" />
        </div>
        <CodeBlock title="Claude Code (terminal / tab Code di aplikasi Claude)" code={cmd.claudeCode} />
        <CodeBlock title="Claude Desktop (claude_desktop_config.json)" code={cmd.claudeDesktop} />
        <button type="button" onClick={() => location.reload()} className="text-sm font-semibold text-ink/70 underline underline-offset-2 hover:text-ink">
          Selesai, tutup
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <Input name="name" placeholder="Nama token, mis. Claude di laptop" maxLength={60} aria-label="Nama token" required />
        <div className="mt-2">
          <FormMessage error={state.error} />
        </div>
      </div>
      <SubmitButton pendingLabel="Membuat…">
        <Key size={16} weight="bold" /> Buat token
      </SubmitButton>
    </form>
  );
}
