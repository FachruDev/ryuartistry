import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

/** Shared by the admin editor and the server-side renderer so both read the same schema. */
export const richTextExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } },
  }),
  Image.configure({ HTMLAttributes: { loading: "lazy" } }),
];
