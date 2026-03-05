'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function RealTimeKeywords() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let socket: Socket | null = null;

    const fetchInitial = async () => {
      try {
        const res = await fetch(`${API_BASE}/keywords`);
        const data = await res.json();
        setKeywords(data.keywords ?? []);
      } catch {
        setKeywords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();

    socket = io(API_BASE, {
      path: '/ws-keywords',
      transports: ['websocket', 'polling'],
    });

    socket.on('keywords:updated', (payload: { keywords?: string[] }) => {
      setKeywords(payload.keywords ?? []);
    });

    return () => {
      socket?.disconnect();
    };
  }, []);

  const handleKeywordClick = (keyword: string) => {
    const params = new URLSearchParams({ q: keyword });
    const categoryMatch = pathname?.match(/^\/categories\/([^/]+)$/);
    if (categoryMatch) params.set('category', categoryMatch[1]);
    router.push(`/search?${params}`);
  };

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          실시간 인기키워드
        </h2>
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            로딩 중...
          </p>
        ) : keywords.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            검색어가 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {keywords.slice(0, 5).map((kw, i) => {
              const rank = i + 1;
              const rankStyle =
                rank === 1
                  ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-500/50 dark:bg-amber-500 dark:text-amber-950 dark:shadow-amber-400/20'
                  : rank === 2
                    ? 'bg-slate-300 text-slate-800 shadow-md shadow-slate-400/30 ring-2 ring-slate-400/50 dark:bg-slate-500 dark:text-white dark:shadow-slate-400/20'
                    : rank === 3
                      ? 'bg-amber-600/90 text-amber-950 shadow-md shadow-amber-700/30 ring-2 ring-amber-600/50 dark:bg-amber-700 dark:text-white dark:shadow-amber-600/20'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
              return (
                <li key={`${kw}-${i}`}>
                  <button
                    type="button"
                    onClick={() => handleKeywordClick(kw)}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${rankStyle}`}
                    >
                      {rank}
                    </span>
                    <span className="truncate text-slate-700 dark:text-slate-300">
                      {kw}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
