'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { api, getToken, UPLOAD_BASE } from '@/lib/api';

type Comment = {
  id: number;
  content: string;
  depth: number;
  isModified: boolean;
  createdAt: string;
  author: { id: number; name: string };
  replies?: Comment[];
};

type Post = {
  id: number;
  title: string;
  content: string;
  viewCount: number;
  likeCount: number;
  isModified: boolean;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
  author: { id: number; name: string };
  category: { name: string };
  images: { filePath: string }[];
  tags: { tagName: string }[];
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, token } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const fetchPost = useCallback(async () => {
    try {
      const data = await api<Post>(`/posts/${id}`);
      setPost(data);
    } catch {
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const data = await api<Comment[]>(`/posts/${id}/comments`);
      setComments(data);
    } catch {
      setComments([]);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [fetchPost, fetchComments]);

  const handleLike = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const res = await api<{ liked: boolean; likeCount: number }>(
        `/posts/${id}/like`,
        {
          method: 'POST',
          token,
        }
      );
      setLiked(res.liked);
      if (post) setPost({ ...post, likeCount: res.likeCount });
    } catch {}
  };

  const handleSubmitComment = async (
    e: React.FormEvent,
    parentId?: number,
    text?: string
  ) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    const content = text ?? commentText;
    if (!content.trim()) return;
    try {
      await api(`/posts/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          parentId: parentId || null,
        }),
        token: getToken() || undefined,
      });
      setCommentText('');
      setReplyText('');
      setReplyTo(null);
      fetchComments();
    } catch {}
  };

  const handleEditComment = async (commentId: number) => {
    if (!editText.trim()) return;
    try {
      await api(`/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content: editText.trim() }),
        token: getToken() || undefined,
      });
      setEditingComment(null);
      setEditText('');
      fetchComments();
    } catch {}
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await api(`/comments/${commentId}`, {
        method: 'DELETE',
        token: getToken() || undefined,
      });
      fetchComments();
    } catch {}
  };

  const handleDeletePost = async () => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await api(`/posts/${id}`, {
        method: 'DELETE',
        token: getToken() || undefined,
      });
      router.push('/board');
    } catch {}
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500';

  const renderComment = (c: Comment, depth: number) => (
    <div
      key={c.id}
      className={
        depth > 0
          ? 'ml-6 mt-2 border-l-2 border-slate-200 pl-4 dark:border-slate-700'
          : 'border-b border-slate-100 pb-4 last:border-b-0 last:pb-0 dark:border-slate-800'
      }
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-900 dark:text-white">
          {c.author.name}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {new Date(c.createdAt).toLocaleString('ko-KR')}
          {c.isModified && ' (수정됨)'}
        </span>
      </div>
      {editingComment === c.id ? (
        <div className="mt-2">
          <textarea
            spellCheck={false}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className={inputClass}
            rows={2}
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => handleEditComment(c.id)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              저장
            </button>
            <button
              onClick={() => setEditingComment(null)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
          {c.content}
        </p>
      )}
      {user && user.id === c.author.id && editingComment !== c.id && (
        <div className="mt-1 flex gap-2">
          <button
            onClick={() => {
              setEditingComment(c.id);
              setEditText(c.content);
            }}
            className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
          >
            수정
          </button>
          <button
            onClick={() => handleDeleteComment(c.id)}
            className="text-xs text-red-600 hover:underline"
          >
            삭제
          </button>
        </div>
      )}
      {user && depth < 4 && (
        <button
          onClick={() => {
            setReplyText('');
            setReplyTo(replyTo === c.id ? null : c.id);
          }}
          className="mt-1 text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
        >
          답글
        </button>
      )}
      {replyTo === c.id && (
        <form
          onSubmit={(e) => handleSubmitComment(e, c.id, replyText)}
          className="mt-2"
        >
          <textarea
            spellCheck={false}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="답글 입력..."
            className={inputClass}
            rows={2}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              등록
            </button>
            <button
              type="button"
              onClick={() => {
                setReplyText('');
                setReplyTo(null);
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              취소
            </button>
          </div>
        </form>
      )}
      {c.replies?.map((r) => renderComment(r, depth + 1))}
    </div>
  );

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          로딩 중...
        </p>
      </div>
    );
  if (!post)
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/30">
        <p className="text-slate-500 dark:text-slate-400">
          게시글을 찾을 수 없습니다.
        </p>
      </div>
    );

  const isAuthor = user?.id === post.author.id;

  return (
    <article>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {post.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {post.category.name} · {post.author.name} ·{' '}
          {new Date(post.createdAt).toLocaleString('ko-KR')}
          {post.isModified && ' · 수정됨'} · 조회 {post.viewCount} · 좋아요{' '}
          {post.likeCount}
        </p>
      </header>

      {post.images?.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {post.images.map((img) => (
            <div
              key={img.filePath}
              className="relative h-64 w-48 overflow-hidden rounded-lg shadow-sm"
            >
              <Image
                src={`${UPLOAD_BASE}/${img.filePath}`}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>
      )}

      <div
        className={
          post.content.trim().startsWith('<')
            ? 'prose prose-slate max-w-none py-4 dark:prose-invert [&_img]:max-w-full [&_img]:rounded-lg'
            : 'whitespace-pre-wrap py-4 text-slate-700 dark:text-slate-300'
        }
      >
        {post.content.trim().startsWith('<') ? (
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        ) : (
          post.content
        )}
      </div>

      {post.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span
              key={t.tagName}
              className="rounded-lg bg-slate-200 px-2.5 py-1 text-sm text-slate-700 dark:bg-slate-700 dark:text-slate-300"
            >
              {t.tagName}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        <button
          onClick={handleLike}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            liked
              ? 'bg-blue-700 text-white dark:bg-blue-600'
              : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          }`}
        >
          좋아요 {post.likeCount}
        </button>
        {isAuthor && (
          <>
            <Link
              href={`/posts/${id}/edit`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              수정
            </Link>
            <button
              onClick={handleDeletePost}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-slate-950 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              삭제
            </button>
          </>
        )}
      </div>

      <section className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          댓글 ({comments.length})
        </h2>

        {user ? (
          <form onSubmit={(e) => handleSubmitComment(e)} className="mt-4">
            <textarea
              spellCheck={false}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              rows={3}
            />
            <button
              type="submit"
              className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              등록
            </button>
          </form>
        ) : (
          <p className="mt-4 rounded-lg bg-slate-50/50 p-4 text-sm text-slate-600 dark:bg-slate-900/30 dark:text-slate-400">
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              로그인
            </Link>
            하면 댓글을 작성할 수 있습니다.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {comments.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
              아직 댓글이 없습니다.
            </p>
          ) : (
            comments.map((c) => renderComment(c, 0))
          )}
        </div>
      </section>
    </article>
  );
}
