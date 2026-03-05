import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { KeywordsService } from './keywords.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('keywords')
export class KeywordsController {
  constructor(private readonly keywordsService: KeywordsService) {}

  @Public()
  @Get()
  async getTopKeywords(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    const keywords = await this.keywordsService.getTopKeywords(
      Math.min(Math.max(limitNum, 1), 5),
    );
    return { keywords };
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('stats')
  async getKeywordsStats() {
    const items = await this.keywordsService.getKeywordsWithScores();
    return { items };
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('reset')
  async resetKeywords() {
    await this.keywordsService.clearKeywords();
    return { ok: true };
  }
}
