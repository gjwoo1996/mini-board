'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api, getToken } from '@/lib/api';
import { TagInput } from '@/components/TagInput';
import { RichTextEditor } from '@/components/RichTextEditor';

type Category = { id: number; name: string };
type Post = {
  id: number;
  title: string;
  content: string;
  categoryId: number;
  author?: { id: number };
  tags: { tagName: string }[];
};

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    Promise.all([
      api<Post>(`/posts/${id}`),
      api<Category[]>('/categories'),
    ])
      .then(([p, cats]) => {
        setPost(p);
        setTitle(p.title);
        setContent(p.content);
        setCategoryId(String(p.categoryId));
        setTags(p.tags?.map((t) => t.tagName) || ['']);
        setCategories(cats);
      })
      .catch(() => setPost(null));
  }, [id, user, authLoading, router]);

  useEffect(() => {
    if (post && user && post.author?.id !== user.id) {
      router.push(`/posts/${id}`);
    }
  }, [post, user, id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api(`/posts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          content,
          categoryId: +categoryId,
          tags,
        }),
        token: getToken() || undefined,
      });
      router.push(`/posts/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '수정 실패');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !post) return null;

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500';

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
        글 수정
      </h1>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            카테고리
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className={inputClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            내용 (이미지 버튼으로 삽입, 드래그/붙여넣기 지원)
          </label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            token={getToken()}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            태그 (최대 5개, #태그 형식)
          </label>
          <TagInput
            value={tags}
            onChange={setTags}
            maxTags={5}
            placeholder="#태그 입력 후 스페이스"
            className="min-h-[42px]"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {submitting ? '수정 중...' : '수정'}
          </button>
          <Link
            href={`/posts/${id}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
