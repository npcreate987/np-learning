"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

/**
 * Read-only renderer for Tiptap JSON content.
 */
export function LessonContent({ content }: { content: unknown }) {
  const editor = useEditor({
    extensions: [StarterKit],
    editable: false,
    content: (content as object) ?? {},
    immediatelyRender: false,
    editorProps: { attributes: { class: "prose-content" } },
  });

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent((content as object) ?? {});
    }
  }, [editor, content]);

  if (!editor) {
    return null;
  }
  return <EditorContent editor={editor} />;
}
