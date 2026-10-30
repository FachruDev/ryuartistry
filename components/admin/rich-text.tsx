"use client";

import { useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import type { LocalizedDoc } from "@/lib/db/schema";
import { richTextExtensions } from "@/lib/tiptap";
import { MediaLibraryDialog } from "./media-picker";

type Lang = "id" | "en";

export function LocalizedRichText({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: LocalizedDoc;
}) {
  const [lang, setLang] = useState<Lang>("id");
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <div role="tablist" aria-label={`Bahasa ${label}`} className="flex rounded-md border border-line p-0.5 text-xs font-semibold">
          {(["id", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={lang === l}
              onClick={() => setLang(l)}
              className={`rounded px-2.5 py-1 ${lang === l ? "bg-ink text-paper" : "text-muted hover:text-text"}`}
            >
              {l === "id" ? "Indonesia" : "English"}
            </button>
          ))}
        </div>
      </div>
      {/* Both editors stay mounted so switching tabs never loses unsaved text. */}
      <EditorPane name={`${name}.id`} hidden={lang !== "id"} initial={defaultValue?.id ?? null} />
      <EditorPane name={`${name}.en`} hidden={lang !== "en"} initial={defaultValue?.en ?? null} />
    </div>
  );
}

function EditorPane({ name, hidden, initial }: { name: string; hidden: boolean; initial: JSONContent | null }) {
  const [json, setJson] = useState(() => (initial ? JSON.stringify(initial) : ""));
  const editor = useEditor({
    extensions: richTextExtensions,
    content: initial ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose-ryu min-h-[260px] max-w-none px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => setJson(editor.isEmpty ? "" : JSON.stringify(editor.getJSON())),
  });

  return (
    <div hidden={hidden} className="overflow-hidden rounded-md border border-line bg-paper-raised focus-within:border-glow">
      <input type="hidden" name={name} value={json} />
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [pickingImage, setPickingImage] = useState(false);
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      quote: editor.isActive("blockquote"),
      code: editor.isActive("codeBlock"),
      link: editor.isActive("link"),
    }),
  });

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL tautan (kosongkan untuk menghapus)", previous ?? "https://");
    if (url === null) return;
    if (!url) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const buttons: { label: string; title: string; active?: boolean; run: () => void }[] = [
    { label: "B", title: "Tebal", active: state.bold, run: () => editor.chain().focus().toggleBold().run() },
    { label: "I", title: "Miring", active: state.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { label: "H2", title: "Judul bagian", active: state.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "H3", title: "Subjudul", active: state.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "• List", title: "Daftar", active: state.bullet, run: () => editor.chain().focus().toggleBulletList().run() },
    { label: "1. List", title: "Daftar bernomor", active: state.ordered, run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "Kutipan", title: "Kutipan", active: state.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: "Kode", title: "Blok kode", active: state.code, run: () => editor.chain().focus().toggleCodeBlock().run() },
    { label: "Tautan", title: "Tautan", active: state.link, run: setLink },
    { label: "Gambar", title: "Sisipkan gambar", run: () => setPickingImage(true) },
  ];

  return (
    <div className="flex flex-wrap gap-1 border-b border-line bg-paper px-2 py-1.5">
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          title={b.title}
          aria-pressed={b.active}
          // Keep the editor's selection; otherwise the click moves the caret before the command runs.
          onMouseDown={(e) => e.preventDefault()}
          onClick={b.run}
          className={`rounded px-2 py-1 text-xs font-semibold ${
            b.active ? "bg-ink text-paper" : "text-text hover:bg-line/60"
          }`}
        >
          {b.label}
        </button>
      ))}
      {pickingImage && (
        <MediaLibraryDialog
          onClose={() => setPickingImage(false)}
          onSelect={(items) => {
            const m = items[0];
            if (m) editor.chain().focus().setImage({ src: m.url, alt: m.alt.id || m.alt.en }).run();
            setPickingImage(false);
          }}
        />
      )}
    </div>
  );
}
