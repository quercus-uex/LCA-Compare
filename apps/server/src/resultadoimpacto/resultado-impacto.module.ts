import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResultadoImpactoService } from './resultado-impacto.service';
import { ResultadoImpactoController } from './resultado-impacto.controller';
import { OrganizacionAccesoModule } from '../organizacion/organizacion-acceso.module';

@Module({
  imports: [OrganizacionAccesoModule],
  controllers: [ResultadoImpactoController],
  providers: [PrismaService, ResultadoImpactoService],
  exports: [ResultadoImpactoService],
})
export class ResultadoImpactoModule {}
