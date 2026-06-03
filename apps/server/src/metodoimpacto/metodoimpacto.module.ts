import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetodoImpactoService } from './metodoimpacto.service';

@Module({
  imports: [],
  controllers: [],
  providers: [PrismaService, MetodoImpactoService],
  exports: [MetodoImpactoService],
})
export class MetodoImpactoModule {}
