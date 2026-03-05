import { Module } from '@nestjs/common';
import { KeywordsService } from './keywords.service';
import { KeywordsController } from './keywords.controller';
import { KeywordsGateway } from './keywords.gateway';

@Module({
  controllers: [KeywordsController],
  providers: [KeywordsService, KeywordsGateway],
  exports: [KeywordsService, KeywordsGateway],
})
export class KeywordsModule {}
