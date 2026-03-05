'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, getToken } from '@/lib/api';

type KeywordStat = { keyword: string; score: number };

export default function AdminStatisticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<KeywordStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resetting, setResetting] = useState(false);

  const hasAnomalousScores = items.some((item) => item.score > 1e9);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api<{ items: KeywordStat[] }>('/keywords/stats', {
        token: getToken() || undefined,
      });
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '조회 실패');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
      return;
    }
    queueMicrotask(() => fetchStats());
  }, [user, authLoading, router, fetchStats]);

  const handleReset = async () => {
    if (
      !confirm(
        '실시간 인기키워드 데이터를 모두 초기화합니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?'
      )
    )
      return;
    setResetting(true);
    setError('');
    try {
      await api('/keywords/reset', {
        method: 'POST',
        token: getToken() || undefined,
      });
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '초기화 실패');
    } finally {
      setResetting(false);
    }
  };

  if (authLoading || !user || user.role !== 'admin') return null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
        통계
      </h1>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            실시간 인기키워드 점수 현황
          </h2>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {resetting ? '초기화 중...' : '데이터 초기화'}
          </button>
        </div>

        {!loading && hasAnomalousScores && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
            <strong>검색 횟수가 비정상적으로 높습니다.</strong> 과거 데이터 형식이 남아 있을 수 있습니다.
            아래 &quot;데이터 초기화&quot;를 눌러 초기화한 뒤 다시 검색해 보세요.
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
            <span className="text-sm text-slate-500">로딩 중...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center dark:border-slate-600 dark:bg-slate-900/30">
            <p className="text-slate-500 dark:text-slate-400">
              키워드 데이터가 없습니다. 검색을 진행하면 데이터가 쌓입니다.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                  <th className="p-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                    순위
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                    키워드
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                    검색 횟수
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr
                    key={`${item.keyword}-${i}`}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="p-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {i + 1}
                    </td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">
                      {item.keyword}
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                      {Math.round(item.score)}회
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>{items.length > 0 ? `총 ${items.length}개 키워드` : ''}</span>
            <button
              type="button"
              onClick={fetchStats}
              className="rounded-lg px-3 py-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              새로고침
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
