"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

interface BlogEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MenuBar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  if (!editor) return null;

  const buttons = [
    { name: "bold", label: "B" },
    { name: "italic", label: "I" },
    { name: "strike", label: "S" },
    { name: "heading", label: "H2", attrs: { level: 2 } },
    { name: "bulletList", label: "• List" },
    { name: "orderedList", label: "1. List" },
    { name: "link", label: "Link" },
    { name: "image", label: "Image" },
  ];

  const handleButton = (name: string, attrs?: any) => {
    if (!editor) return;
    const chain: any = editor.chain().focus(); // <--- cast to any

    switch (name) {
      case "bold":
        chain.toggleBold().run();
        break;
      case "italic":
        chain.toggleItalic().run();
        break;
      case "strike":
        chain.toggleStrike().run();
        break;
      case "heading":
        chain.toggleHeading(attrs).run();
        break;
      case "bulletList":
        chain.toggleBulletList().run();
        break;
      case "orderedList":
        chain.toggleOrderedList().run();
        break;
      case "link":
        const url = prompt("Enter URL");
        if (url) chain.setLink({ href: url }).run();
        break;
      case "image":
        const src = prompt("Enter image URL");
        if (src) chain.setImage({ src }).run();
        break;
    }
  };

  return (
    <div className="mb-2 flex flex-wrap gap-1">
      {buttons.map((btn) => (
        <button
          key={btn.name}
          type="button"
          onClick={() => handleButton(btn.name, btn.attrs)}
          className="px-2 py-1 border rounded hover:bg-gray-200"
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
};

const BlogEditor: React.FC<BlogEditorProps> = ({ value, onChange }) => {
  const editor: Editor | null = useEditor({
    extensions: [StarterKit, Link, Image],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "outline-none min-h-[200px] p-2 border border-gray-300 rounded-md",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default BlogEditor;
