'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, getToken } from '@/lib/api';

type Category = { id: number; name: string; slug: string };

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
      return;
    }
    fetchCategories();
  }, [user, authLoading, router]);

  const fetchCategories = async () => {
    try {
      const data = await api<Category[]>('/categories');
      setCategories(data);
    } catch {
      setCategories([]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api('/categories', {
        method: 'POST',
        body: JSON.stringify({ name, slug: slug || undefined }),
        token: getToken() || undefined,
      });
      setName('');
      setSlug('');
      fetchCategories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '생성 실패');
    }
  };

  const handleUpdate = async (id: number) => {
    setError('');
    try {
      await api(`/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editName, slug: editSlug || undefined }),
        token: getToken() || undefined,
      });
      setEditingId(null);
      fetchCategories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '수정 실패');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    setError('');
    try {
      await api(`/categories/${id}`, {
        method: 'DELETE',
        token: getToken() || undefined,
      });
      fetchCategories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '삭제 실패');
    }
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditSlug(c.slug);
  };

  if (authLoading || !user || user.role !== 'admin') return null;

  const inputClass =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500';

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
        카테고리 관리
      </h1>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <form
        onSubmit={handleCreate}
        className="mb-8 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <input
          type="text"
          placeholder="카테고리 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={`${inputClass} min-w-[160px]`}
        />
        <input
          type="text"
          placeholder="slug (선택)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className={`${inputClass} w-32`}
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          추가
        </button>
      </form>

      <ul className="space-y-2">
        {categories.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {editingId === c.id ? (
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`${inputClass} min-w-[120px] flex-1`}
                />
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className={`${inputClass} w-32`}
                />
                <button
                  onClick={() => handleUpdate(c.id)}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <span className="font-medium text-slate-900 dark:text-white">
                  {c.name}{' '}
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    ({c.slug})
                  </span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(c)}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    삭제
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
