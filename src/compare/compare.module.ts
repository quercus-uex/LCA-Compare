import { Module } from '@nestjs/common';
import { CompareController } from './compare.controller';
import { CompareService } from './compare.service';
import { ResultadoImpactoModule } from '../resultadoimpacto/resultado-impacto.module';

@Module({
  imports: [ResultadoImpactoModule],
  controllers: [CompareController],
  providers: [CompareService],
  exports: [CompareService],
})
export class CompareModule {}
