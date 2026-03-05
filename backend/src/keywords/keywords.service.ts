import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

const KEYWORDS_KEY = 'keywords:rank';
const DEFAULT_LIMIT = 5;
/** React Strict Mode 등으로 동일 검색이 2회 호출되는 것 방지 (ms) */
const DEDUP_MS = 2000;

/** Redis client interface for type-safe usage (avoids ioredis type resolution issues) */
interface RedisClientLike {
  zincrby(key: string, increment: number, member: string): Promise<string>;
  zrevrange(
    key: string,
    start: number,
    stop: number,
    withScores?: 'WITHSCORES',
  ): Promise<string[]>;
  del(key: string): Promise<number>;
  disconnect(): void;
}

@Injectable()
export class KeywordsService implements OnModuleDestroy {
  private redis: RedisClientLike | null = null;
  private lastAddedAt = new Map<string, number>();

  private getClient(): RedisClientLike | null {
    if (this.redis) return this.redis;
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    try {
      const client = new Redis({ host, port }) as RedisClientLike;
      this.redis = client;
      return client;
    } catch {
      return null;
    }
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.disconnect();
      this.redis = null;
    }
  }

  async addKeyword(keyword: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;
    const k = keyword.trim().toLowerCase();
    if (!k) return;
    const now = Date.now();
    const last = this.lastAddedAt.get(k);
    if (last != null && now - last < DEDUP_MS) return;
    this.lastAddedAt.set(k, now);
    if (this.lastAddedAt.size > 1000) {
      const toDelete: string[] = [];
      for (const [key, ts] of this.lastAddedAt) {
        if (now - ts > DEDUP_MS) toDelete.push(key);
      }
      for (const key of toDelete) this.lastAddedAt.delete(key);
    }
    await client.zincrby(KEYWORDS_KEY, 1, k);
  }

  async getTopKeywords(limit = DEFAULT_LIMIT): Promise<string[]> {
    const client = this.getClient();
    if (!client) return [];
    const results = await client.zrevrange(KEYWORDS_KEY, 0, limit - 1);
    return results;
  }

  /** Admin: 키워드 데이터 초기화 (레거시 Date.now() 점수 등 비정상 데이터 정리용) */
  async clearKeywords(): Promise<void> {
    const client = this.getClient();
    if (!client) return;
    await client.del(KEYWORDS_KEY);
  }

  /** Admin: 모든 키워드와 점수 반환 (점수 내림차순) */
  async getKeywordsWithScores(): Promise<{ keyword: string; score: number }[]> {
    const client = this.getClient();
    if (!client) return [];
    const raw = await client.zrevrange(KEYWORDS_KEY, 0, -1, 'WITHSCORES');
    const items: { keyword: string; score: number }[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      const keyword = raw[i];
      const scoreVal = raw[i + 1];
      if (keyword == null) continue;
      const score =
        typeof scoreVal === 'string' ? parseFloat(scoreVal) : Number(scoreVal);
      items.push({ keyword, score });
    }
    return items;
  }
}
