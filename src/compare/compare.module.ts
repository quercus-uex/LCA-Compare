import { Module } from '@nestjs/common';
import { CompareController } from './compare.controller';
import { CompareService } from './compare.service';
import { ResultadoImpactoModule } from '../resultadoimpacto/resultado-impacto.module';
import { ProvinciaModule } from '../provincia/provincia.module';
import { PoblacionModule } from '../poblacion/poblacion.module';
import { PaisModule } from '../pais/pais.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    ResultadoImpactoModule,
    ProvinciaModule,
    PoblacionModule,
    PaisModule,
    AiModule,
  ],
  controllers: [CompareController],
  providers: [CompareService],
  exports: [CompareService],
})
export class CompareModule {}
