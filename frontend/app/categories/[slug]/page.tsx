'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
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

export default function CategoryBoardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchCategory = useCallback(async () => {
    try {
      const data = await api<Category>(`/categories/slug/${slug}`);
      setCategory(data);
      return data.id;
    } catch {
      setCategory(null);
      return null;
    }
  }, [slug]);

  const fetchPosts = useCallback(
    async (categoryId: number, overridePage?: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(overridePage ?? page));
        params.set('limit', '50');
        params.set('categoryId', String(categoryId));
        const data = await api<ListResponse>(`/posts?${params}`);
        setPosts(data.items);
        setTotal(data.total);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    [page],
  );

  useEffect(() => {
    fetchCategory().then((categoryId) => {
      if (categoryId) fetchPosts(categoryId);
      else setLoading(false);
    });
  }, [slug, fetchCategory, fetchPosts]);

  const totalPages = Math.ceil(total / 50) || 1;

  if (!category && !loading) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/30">
        <p className="text-slate-500 dark:text-slate-400">
          카테고리를 찾을 수 없습니다.
        </p>
        <Link
          href="/categories"
          className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          카테고리 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* 카테고리 표시 UI */}
      <nav className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-slate-700 dark:hover:text-slate-300">
          홈
        </Link>
        <span className="mx-2">/</span>
        <Link
          href="/categories"
          className="hover:text-slate-700 dark:hover:text-slate-300"
        >
          카테고리
        </Link>
        {category && (
          <>
            <span className="mx-2">/</span>
            <span className="text-slate-900 dark:text-white">
              {category.name}
            </span>
          </>
        )}
      </nav>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {category?.name ?? '로딩 중...'} 게시판
        </h1>
        <Link
          href="/posts/new"
          className="shrink-0 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          글쓰기
        </Link>
      </div>

      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        검색은 상단 헤더의 검색창을 이용해 주세요.
      </p>

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
                    <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
                      <Image
                        src={`${UPLOAD_BASE}/${post.images[0].filePath}`}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
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
                      댓글 {post.commentCount ?? 0}
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
