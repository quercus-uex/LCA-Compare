import { Module } from '@nestjs/common';
import { CompareController } from './compare.controller';
import { CompareService } from './compare.service';
import { ResultadoImpactoModule } from '../resultadoimpacto/resultado-impacto.module';
import { ProvinciaModule } from '../provincia/provincia.module';
import { PoblacionModule } from '../poblacion/poblacion.module';

@Module({
  imports: [ResultadoImpactoModule, ProvinciaModule, PoblacionModule],
  controllers: [CompareController],
  providers: [CompareService],
  exports: [CompareService],
})
export class CompareModule {}
