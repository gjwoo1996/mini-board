import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { KeywordsService } from '../keywords/keywords.service';
import { KeywordsGateway } from '../keywords/keywords.gateway';
import { CategoriesService } from '../categories/categories.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('search')
export class SearchController {
  constructor(
    private searchService: SearchService,
    private keywordsService: KeywordsService,
    private keywordsGateway: KeywordsGateway,
    private categoriesService: CategoriesService,
  ) {}

  @Public()
  @Get()
  async search(
    @Query('q') q: string,
    @Query('page') page?: string,
    @Query('category') categorySlug?: string,
  ) {
    let categoryId: number | undefined;
    if (categorySlug?.trim()) {
      try {
        const cat = await this.categoriesService.findBySlug(categorySlug.trim());
        categoryId = cat.id;
      } catch {
        // invalid slug, ignore
      }
    }
    const result = await this.searchService.search(
      q || '',
      page ? parseInt(page, 10) : 1,
      50,
      categoryId,
    );
    if (q?.trim()) {
      void this.keywordsService.addKeyword(q.trim()).then(() => {
        void this.keywordsGateway.broadcastKeywordsUpdate();
      });
    }
    return result;
  }
}
