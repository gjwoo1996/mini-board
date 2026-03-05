import Link from 'next/link';
import { api, UPLOAD_BASE } from '@/lib/api';

type Post = {
  id: number;
  title: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  category?: { name: string };
  images?: { filePath: string }[];
};

async function getPopularPosts(): Promise<Post[]> {
  try {
    return await api<Post[]>('/posts/popular');
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const posts = await getPopularPosts();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          인기글
        </h1>
        <Link
          href="/board"
          className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          게시판 목록 →
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/30">
          <p className="text-slate-500 dark:text-slate-400">
            아직 게시글이 없습니다.
          </p>
          <Link
            href="/board"
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            게시판으로 이동
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/posts/${post.id}`}
                className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                {post.images?.[0] && (
                  <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
                    <img
                      src={`${UPLOAD_BASE}/${post.images[0].filePath}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-medium text-slate-900 dark:text-white">
                    {post.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {post.category?.name} · 조회 {post.viewCount} · 좋아요{' '}
                    {post.likeCount}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
