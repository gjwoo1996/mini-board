import { Injectable, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

const INDEX_NAME = 'mini-board-posts';

@Injectable()
export class SearchService implements OnModuleInit {
  constructor(private readonly es: ElasticsearchService) {}

  async onModuleInit() {
    await this.ensureIndex();
  }

  private async ensureIndex() {
    const exists = await this.es.indices.exists({ index: INDEX_NAME });
    if (exists) return;

    await this.es.indices.create({
      index: INDEX_NAME,
      settings: {
        analysis: {
          tokenizer: {
            nori_tokenizer: {
              type: 'nori_tokenizer',
              decompound_mode: 'mixed',
            },
          },
          analyzer: {
            nori_analyzer: {
              type: 'custom',
              tokenizer: 'nori_tokenizer',
              filter: ['lowercase'],
            },
          },
        },
      },
      mappings: {
        properties: {
          id: { type: 'long' },
          title: {
            type: 'text',
            analyzer: 'nori_analyzer',
            fields: { keyword: { type: 'keyword' } },
          },
          content: { type: 'text', analyzer: 'nori_analyzer' },
          tags: {
            type: 'text',
            analyzer: 'nori_analyzer',
            fields: { keyword: { type: 'keyword' } },
          },
          categoryId: { type: 'long' },
          categoryName: {
            type: 'keyword',
            fields: {
              text: { type: 'text', analyzer: 'nori_analyzer' },
            },
          },
          authorId: { type: 'long' },
          authorName: { type: 'keyword' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
        },
      },
    });
  }

  async indexPost(doc: {
    id: number;
    title: string;
    content: string;
    tags: string[];
    categoryId: number;
    categoryName: string;
    authorId: number;
    authorName: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    await this.es.index({
      index: INDEX_NAME,
      id: String(doc.id),
      document: {
        ...doc,
        tags: doc.tags || [],
      },
    });
  }

  async updatePost(doc: {
    id: number;
    title?: string;
    content?: string;
    tags?: string[];
    categoryId?: number;
    categoryName?: string;
    authorId?: number;
    authorName?: string;
    updatedAt: Date;
  }) {
    await this.es.update({
      index: INDEX_NAME,
      id: String(doc.id),
      doc: { ...doc, updatedAt: doc.updatedAt },
    });
  }

  async deletePost(id: number) {
    try {
      await this.es.delete({ index: INDEX_NAME, id: String(id) });
    } catch (e: unknown) {
      const err = e as { meta?: { statusCode?: number } };
      if (err?.meta?.statusCode !== 404) throw e;
    }
  }

  async search(q: string, page = 1, size = 50, categoryId?: number) {
    if (!q?.trim()) {
      return { items: [], total: 0, page, size };
    }

    const from = (page - 1) * size;
    const must: object[] = [
      {
        multi_match: {
          query: q.trim(),
          fields: ['title^3', 'content', 'tags^2', 'categoryName.text'],
          type: 'best_fields',
          operator: 'or',
          minimum_should_match: '50%',
          fuzziness: 'AUTO',
        },
      },
    ];
    if (categoryId != null) {
      must.push({ term: { categoryId } });
    }

    const { hits } = await this.es.search({
      index: INDEX_NAME,
      from,
      size,
      query: { bool: { must } },
      sort: [{ _score: { order: 'desc' } }, { createdAt: { order: 'desc' } }],
      highlight: {
        fields: {
          title: { fragment_size: 200, number_of_fragments: 1 },
          content: { fragment_size: 150, number_of_fragments: 2 },
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      },
      track_total_hits: true,
    });

    type EsSource = {
      id?: number;
      title?: string;
      categoryName?: string;
      createdAt?: string;
    };
    type EsHit = {
      _source?: EsSource;
      highlight?: { title?: string[]; content?: string[] };
    };
    const items = (hits.hits ?? []).map((h) => {
      const hit = h as EsHit;
      const src = hit._source;
      return {
        id: src?.id,
        title: src?.title,
        categoryName: src?.categoryName,
        createdAt: src?.createdAt,
        highlight: hit.highlight
          ? {
              title: hit.highlight.title,
              content: hit.highlight.content,
            }
          : undefined,
      };
    });

    type EsTotal = number | { value?: number };
    const totalVal = hits.total as EsTotal;
    const total =
      typeof totalVal === 'number' ? totalVal : (totalVal?.value ?? 0);

    return {
      items,
      total,
      page,
      size,
    };
  }
}
