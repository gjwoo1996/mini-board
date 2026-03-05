import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Public()
  @Get()
  search(
    @Query('q') q: string,
    @Query('page') page?: string,
  ) {
    return this.searchService.search(
      q || '',
      page ? parseInt(page, 10) : 1,
      50,
    );
  }
}
