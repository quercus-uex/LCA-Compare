import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResultadoImpactoService } from './resultado-impacto.service';
import { ResultadoImpactoController } from './resultado-impacto.controller';
import { ParcelaModule } from '../parcela/parcela.module';

@Module({
  imports: [ParcelaModule],
  controllers: [ResultadoImpactoController],
  providers: [PrismaService, ResultadoImpactoService],
  exports: [ResultadoImpactoService],
})
export class ResultadoImpactoModule {}
