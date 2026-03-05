'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

type SearchItem = {
  id: number;
  title: string;
  categoryName: string;
  createdAt: string;
};

type SearchResponse = {
  items: SearchItem[];
  total: number;
  page: number;
  size: number;
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q.trim()) {
      setData({ items: [], total: 0, page: 1, size: 50 });
      setLoading(false);
      return;
    }
    const page = searchParams.get('page') || '1';
    setLoading(true);
    api<SearchResponse>(`/search?q=${encodeURIComponent(q)}&page=${page}`)
      .then(setData)
      .catch(() => setData({ items: [], total: 0, page: 1, size: 50 }))
      .finally(() => setLoading(false));
  }, [q, searchParams]);

  if (!data) return null;

  const totalPages = Math.ceil(data.total / data.size) || 1;
  const currentPage = data.page;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
        검색 결과: &quot;{q}&quot;
      </h1>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            로딩 중...
          </p>
        </div>
      ) : data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/30">
          <p className="text-slate-500 dark:text-slate-400">
            검색 결과가 없습니다.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                  <th className="p-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                    카테고리
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                    제목
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                    날짜
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                      {item.categoryName}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/posts/${item.id}`}
                        className="font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="p-3 text-sm text-slate-500 dark:text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Link
                href={`/search?q=${encodeURIComponent(q)}&page=${currentPage - 1}`}
                className={`rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 ${
                  currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                이전
              </Link>
              <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">
                {currentPage} / {totalPages}
              </span>
              <Link
                href={`/search?q=${encodeURIComponent(q)}&page=${currentPage + 1}`}
                className={`rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 ${
                  currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                다음
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
