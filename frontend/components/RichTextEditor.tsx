'use client';

import { createPortal } from 'react-dom';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageResize from 'tiptap-extension-resize-image';
import Emoji, { emojis } from '@tiptap/extension-emoji';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFormData, UPLOAD_BASE } from '@/lib/api';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  token?: string | null;
};

const btnClass =
  'rounded px-2 py-1 text-sm transition-colors hover:bg-slate-200 dark:hover:bg-slate-600';
const btnActiveClass = 'bg-slate-200 dark:bg-slate-600';

function Toolbar({
  editor,
  token,
}: {
  editor: Editor | null;
  token?: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await apiFormData<{ path: string }>(
          '/uploads',
          formData,
          token || undefined
        );
        const url = `${UPLOAD_BASE}/${res.path}`;
        editor
          ?.chain()
          .focus()
          .insertContent({ type: 'imageResize', attrs: { src: url } })
          .run();
      } catch {}
      e.target.value = '';
    },
    [editor, token]
  );

  const handleLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('링크 URL', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor
      ?.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50">
      {/* 마크: Bold, Italic, Strike, Underline, Code */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${btnClass} font-bold ${
          editor.isActive('bold') ? btnActiveClass : ''
        }`}
        title="굵게"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${btnClass} italic ${
          editor.isActive('italic') ? btnActiveClass : ''
        }`}
        title="기울임"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`${btnClass} line-through ${
          editor.isActive('strike') ? btnActiveClass : ''
        }`}
        title="취소선"
      >
        S
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`${btnClass} underline ${
          editor.isActive('underline') ? btnActiveClass : ''
        }`}
        title="밑줄"
      >
        U
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`${btnClass} font-mono text-xs ${
          editor.isActive('code') ? btnActiveClass : ''
        }`}
        title="인라인 코드"
      >
        {'</>'}
      </button>

      <span className="mx-1 w-px self-stretch bg-slate-300 dark:bg-slate-600" />

      {/* 블록: 제목, 인용, 목록, 코드블록, 구분선 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`${btnClass} ${
          editor.isActive('heading', { level: 1 }) ? btnActiveClass : ''
        }`}
        title="제목 1"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${btnClass} ${
          editor.isActive('heading', { level: 2 }) ? btnActiveClass : ''
        }`}
        title="제목 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${btnClass} ${
          editor.isActive('heading', { level: 3 }) ? btnActiveClass : ''
        }`}
        title="제목 3"
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${btnClass} ${
          editor.isActive('blockquote') ? btnActiveClass : ''
        }`}
        title="인용구"
      >
        인용
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${btnClass} ${
          editor.isActive('bulletList') ? btnActiveClass : ''
        }`}
        title="글머리 목록"
      >
        목록
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${btnClass} ${
          editor.isActive('orderedList') ? btnActiveClass : ''
        }`}
        title="번호 목록"
      >
        번호
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`${btnClass} font-mono text-xs ${
          editor.isActive('codeBlock') ? btnActiveClass : ''
        }`}
        title="코드 블록"
      >
        코드
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={btnClass}
        title="구분선"
      >
        —
      </button>

      <span className="mx-1 w-px self-stretch bg-slate-300 dark:bg-slate-600" />

      {/* 링크, 이미지 */}
      <button
        type="button"
        onClick={handleLink}
        className={`${btnClass} ${
          editor.isActive('link') ? btnActiveClass : ''
        }`}
        title="링크"
      >
        링크
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={btnClass}
        title="이미지"
      >
        이미지
      </button>
      <EmojiPickerButton editor={editor} />
    </div>
  );
}

type EmojiItem = {
  name: string;
  emoji?: string;
  shortcodes: string[];
  tags: string[];
  group?: string;
  fallbackImage?: string;
};

const EMOJI_GROUPS: { value: string; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'people & body', label: '사람' },
  { value: 'animals & nature', label: '동물·자연' },
  { value: 'food & drink', label: '음식' },
  { value: 'activities', label: '활동' },
  { value: 'travel & places', label: '여행·장소' },
  { value: 'objects', label: '사물' },
  { value: 'symbols', label: '기호' },
  { value: 'flags', label: '깃발' },
  { value: 'GitHub', label: 'GitHub' },
];

function EmojiPickerButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const pickerWidth = 320;
      const pickerMaxHeight = 384;
      let left = rect.left;
      if (left + pickerWidth > window.innerWidth) {
        left = window.innerWidth - pickerWidth - 8;
      }
      if (left < 8) left = 8;
      let top = rect.bottom + 4;
      if (top + pickerMaxHeight > window.innerHeight - 8) {
        top = Math.max(8, rect.top - pickerMaxHeight - 4);
      }
      setPosition({ top, left });
    }
  }, []);

  useEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  const filteredEmojis = useMemo(() => {
    const list = emojis as EmojiItem[];
    const q = search.toLowerCase().trim();
    const hasQuery = q.length > 0;
    return list.filter((item) => {
      if (group && item.group !== group) return false;
      if (!item.emoji && !item.fallbackImage) return false;
      if (!hasQuery) return true;
      const match =
        item.shortcodes?.some((s) => s.toLowerCase().includes(q)) ||
        item.tags?.some((t) => t.toLowerCase().includes(q)) ||
        item.name?.toLowerCase().includes(q);
      return match;
    });
  }, [search, group]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = ref.current?.contains(target);
      const inPicker = pickerRef.current?.contains(target);
      if (!inTrigger && !inPicker) setOpen(false);
    };
    if (open) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  const pickerContent = open && (
    <div
      ref={pickerRef}
      className="fixed z-[9999] w-80 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800"
      style={{ top: position.top, left: position.left }}
    >
          <div className="border-b border-slate-200 p-2 dark:border-slate-600">
            <input
              type="text"
              placeholder="검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {EMOJI_GROUPS.map((g) => (
                <button
                  key={g.value || 'all'}
                  type="button"
                  onClick={() => setGroup(g.value)}
                  className={`rounded px-2 py-0.5 text-xs ${
                    group === g.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            <div className="grid grid-cols-8 gap-0.5">
              {filteredEmojis.map((item) => {
                const shortcode = item.shortcodes?.[0] ?? item.name;
                const display =
                  item.emoji ??
                  (item.fallbackImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- emoji fallback from CDN
                    <img
                      src={item.fallbackImage}
                      alt={shortcode}
                      className="h-5 w-5"
                    />
                  ) : null) ?? `:${shortcode}:`;
                return (
                  <button
                    key={item.name}
                    type="button"
                    className="flex size-8 items-center justify-center rounded text-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => {
                      editor.chain().focus().setEmoji(shortcode).run();
                      setOpen(false);
                    }}
                    title={shortcode}
                  >
                    {display}
                  </button>
                );
              })}
            </div>
            {filteredEmojis.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-500">
                검색 결과가 없습니다.
              </p>
            )}
          </div>
        </div>
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={btnClass}
        title="이모지 (또한 :) <3 등 입력, OS 키보드 Win+. / Mac Ctrl+Cmd+Space)"
      >
        이모지
      </button>
      {typeof document !== 'undefined' &&
        open &&
        createPortal(pickerContent, document.body)}
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = '내용을 입력하세요...',
  className = '',
  token,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      ImageResize.configure({
        inline: false,
        minWidth: 100,
        maxWidth: 800,
      }),
      Emoji.configure({
        enableEmoticons: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-slate dark:prose-invert max-w-none min-h-[400px] px-3 py-2 focus:outline-none',
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        const file = files[0];
        if (!file.type.startsWith('image/')) return false;
        event.preventDefault();
        const formData = new FormData();
        formData.append('image', file);
        apiFormData<{ path: string }>('/uploads', formData, token || undefined)
          .then((res) => {
            const url = `${UPLOAD_BASE}/${res.path}`;
            const { schema } = view.state;
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            if (coordinates) {
              const node = schema.nodes.imageResize.create({ src: url });
              const transaction = view.state.tr.insert(coordinates.pos, node);
              view.dispatch(transaction);
            }
          })
          .catch(() => {});
        return true;
      },
      handlePaste: (view, event) => {
        const files = event.clipboardData?.files;
        if (!files?.length) return false;
        const file = files[0];
        if (!file.type.startsWith('image/')) return false;
        event.preventDefault();
        const formData = new FormData();
        formData.append('image', file);
        const pos = view.state.selection.from;
        apiFormData<{ path: string }>('/uploads', formData, token || undefined)
          .then((res) => {
            const url = `${UPLOAD_BASE}/${res.path}`;
            const { schema } = view.state;
            const node = schema.nodes.imageResize.create({ src: url });
            const transaction = view.state.tr.insert(pos, node);
            view.dispatch(transaction);
          })
          .catch(() => {});
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div
      className={`overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800 ${className}`}
    >
      <Toolbar editor={editor} token={token} />
      <EditorContent editor={editor} />
    </div>
  );
}
