import { Module } from '@nestjs/common';
import { AiService } from './ai.service';

@Module({
  imports: [],
  providers: [AiService],
  controllers: [],
  exports: [AiService],
})
export class AiModule {}
