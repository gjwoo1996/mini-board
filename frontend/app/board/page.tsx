'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, UPLOAD_BASE } from '@/lib/api';

type Post = {
  id: number;
  title: string;
  viewCount: number;
  likeCount: number;
  commentCount?: number;
  createdAt: string;
  category?: { name: string };
  images?: { filePath: string }[];
};

type Category = { id: number; name: string; slug: string };

type ListResponse = {
  items: Post[];
  total: number;
  page: number;
  limit: number;
};

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<string>('');
  const [searchTitle, setSearchTitle] = useState('');
  const [searchContent, setSearchContent] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await api<Category[]>('/categories');
      setCategories(data);
    } catch {}
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      if (categoryId) params.set('categoryId', categoryId);
      if (searchTitle) params.set('searchTitle', searchTitle);
      if (searchContent) params.set('searchContent', searchContent);
      if (searchAuthor) params.set('searchAuthor', searchAuthor);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const data = await api<ListResponse>(`/posts?${params}`);
      setPosts(data.items);
      setTotal(data.total);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [page, categoryId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const handleResetFilters = () => {
    setCategoryId('');
    setSearchTitle('');
    setSearchContent('');
    setSearchAuthor('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setTimeout(() => fetchPosts(), 0);
  };

  const totalPages = Math.ceil(total / 50) || 1;

  const inputClass =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          게시판
        </h1>
        <Link
          href="/posts/new"
          className="shrink-0 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          글쓰기
        </Link>
      </div>

      <form
        onSubmit={handleSearch}
        className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        {/* 1행: 통합 검색창 + 카테고리 + 검색 버튼 */}
        <div className="flex flex-nowrap items-center gap-3">
          <input
            type="text"
            placeholder="제목 검색..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
            className={`${inputClass} min-w-0 flex-1`}
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={`${inputClass} w-auto shrink-0`}
          >
            <option value="">전체 카테고리</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="shrink-0 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            검색
          </button>
        </div>

        {/* 상세 검색 토글 */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            {showAdvanced ? '▲ 상세 검색 접기' : '▼ 상세 검색'}
          </button>
        </div>

        {/* 2행: 접이식 상세 필터 */}
        {showAdvanced && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3 dark:border-slate-700">
            <input
              type="text"
              placeholder="제목"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              className={`${inputClass} min-w-[120px] shrink-0`}
            />
            <input
              type="text"
              placeholder="내용"
              value={searchContent}
              onChange={(e) => setSearchContent(e.target.value)}
              className={`${inputClass} min-w-[120px] shrink-0`}
            />
            <input
              type="text"
              placeholder="작성자"
              value={searchAuthor}
              onChange={(e) => setSearchAuthor(e.target.value)}
              className={`${inputClass} min-w-[100px] shrink-0`}
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`${inputClass} shrink-0`}
            />
            <span className="shrink-0 text-slate-400">~</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`${inputClass} shrink-0`}
            />
            <button
              type="button"
              onClick={handleResetFilters}
              className="shrink-0 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              초기화
            </button>
          </div>
        )}
      </form>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            로딩 중...
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/30">
          <p className="text-slate-500 dark:text-slate-400">
            게시글이 없습니다.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/posts/${post.id}`}
                  className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                >
                  {post.images?.[0] ? (
                    <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
                      <img
                        src={`${UPLOAD_BASE}/${post.images[0].filePath}`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-24 flex-shrink-0 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-medium text-slate-900 dark:text-white">
                      {post.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {post.category?.name} · 댓글 {post.commentCount ?? 0}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="shrink-0 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            이전
          </button>
            <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="shrink-0 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}
