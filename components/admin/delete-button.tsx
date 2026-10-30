"use client";

import { SubmitButton } from "./ui";

/** Small form that confirms before calling a bound delete Server Action. */
export function DeleteButton({ action, label = "Hapus", confirmText }: { action: () => Promise<void>; label?: string; confirmText: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <SubmitButton variant="danger" pendingLabel="Menghapus…">
        {label}
      </SubmitButton>
    </form>
  );
}
