'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Link, Minus,
  AlignLeft, AlignCenter, AlignRight,
  Undo, Redo,
} from 'lucide-react';

interface WysiwygEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

type CommandName =
  | 'bold' | 'italic' | 'underline' | 'strikeThrough'
  | 'insertUnorderedList' | 'insertOrderedList'
  | 'formatBlock' | 'createLink' | 'insertHorizontalRule'
  | 'justifyLeft' | 'justifyCenter' | 'justifyRight'
  | 'undo' | 'redo';

function exec(cmd: CommandName, value?: string) {
  document.execCommand(cmd, false, value);
}

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}

function ToolbarBtn({ onClick, title, active, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`h-7 w-7 rounded-md grid place-items-center transition-colors ${
        active
          ? 'bg-[#1F4D3A] text-white'
          : 'text-[#3A4A42] hover:bg-[#E8EFEB] hover:text-[#1F4D3A]'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-[#E5E0D4] mx-0.5" />;
}

export function WysiwygEditor({ value, onChange, placeholder = 'Start writing…', minHeight = 240 }: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // Sync value → editor (only on mount or external change)
  useEffect(() => {
    if (!editorRef.current) return;
    if (isInternalUpdate.current) { isInternalUpdate.current = false; return; }
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value ?? '';
    }
  }, [value]);

  const handleInput = useCallback(() => {
    isInternalUpdate.current = true;
    onChange(editorRef.current?.innerHTML ?? '');
  }, [onChange]);

  const insertLink = useCallback(() => {
    const url = window.prompt('Enter URL:', 'https://');
    if (url) exec('createLink', url);
  }, []);

  const formatBlock = useCallback((tag: string) => {
    exec('formatBlock', tag);
  }, []);

  return (
    <div className="border border-[#E5E0D4] rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-[#FAF6EE] border-b border-[#E5E0D4]">

        {/* Undo / Redo */}
        <ToolbarBtn onClick={() => exec('undo')} title="Undo"><Undo size={13} /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('redo')} title="Redo"><Redo size={13} /></ToolbarBtn>
        <Divider />

        {/* Block format */}
        <select
          onMouseDown={e => e.preventDefault()}
          onChange={e => { formatBlock(e.target.value); e.target.value = ''; }}
          defaultValue=""
          className="h-7 px-2 text-[12px] text-[#3A4A42] border border-[#E5E0D4] rounded-md bg-white focus:outline-none focus:border-[#1F4D3A] cursor-pointer"
        >
          <option value="" disabled>Paragraph</option>
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="blockquote">Blockquote</option>
          <option value="pre">Code</option>
        </select>
        <Divider />

        {/* Inline styles */}
        <ToolbarBtn onClick={() => exec('bold')} title="Bold (Ctrl+B)"><Bold size={13} strokeWidth={2.5} /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('italic')} title="Italic (Ctrl+I)"><Italic size={13} /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)"><Underline size={13} /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('strikeThrough')} title="Strikethrough"><Strikethrough size={13} /></ToolbarBtn>
        <Divider />

        {/* Lists */}
        <ToolbarBtn onClick={() => exec('insertUnorderedList')} title="Bullet list"><List size={13} /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('insertOrderedList')} title="Numbered list"><ListOrdered size={13} /></ToolbarBtn>
        <Divider />

        {/* Alignment */}
        <ToolbarBtn onClick={() => exec('justifyLeft')} title="Align left"><AlignLeft size={13} /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('justifyCenter')} title="Align center"><AlignCenter size={13} /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('justifyRight')} title="Align right"><AlignRight size={13} /></ToolbarBtn>
        <Divider />

        {/* Insert */}
        <ToolbarBtn onClick={insertLink} title="Insert link"><Link size={13} /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('insertHorizontalRule')} title="Horizontal rule"><Minus size={13} /></ToolbarBtn>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className={[
          'px-5 py-4 text-[15px] text-[#0F1F18] leading-[1.7] outline-none',
          'prose prose-sm max-w-none',
          '[&_h1]:text-[26px] [&_h1]:font-bold [&_h1]:mt-5 [&_h1]:mb-2',
          '[&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2',
          '[&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1',
          '[&_h4]:text-[15px] [&_h4]:font-semibold [&_h4]:mt-2 [&_h4]:mb-1',
          '[&_p]:my-2',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2',
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2',
          '[&_li]:my-0.5',
          '[&_blockquote]:border-l-4 [&_blockquote]:border-[#E8C57E] [&_blockquote]:pl-4 [&_blockquote]:text-[#6B7A72] [&_blockquote]:italic [&_blockquote]:my-3',
          '[&_pre]:bg-[#FAF6EE] [&_pre]:border [&_pre]:border-[#E5E0D4] [&_pre]:rounded-lg [&_pre]:px-4 [&_pre]:py-3 [&_pre]:[&_pre]:text-[13px] [&_pre]:my-3',
          '[&_a]:text-[#1F4D3A] [&_a]:underline',
          '[&_hr]:border-[#E5E0D4] [&_hr]:my-4',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-[#9CA3AF]',
        ].join(' ')}
      />
    </div>
  );
}
