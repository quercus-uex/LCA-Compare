import { Module } from '@nestjs/common';
import { ProvinciaService } from './provincia.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProvinciaController } from './provincia.controller';
import { PoblacionModule } from '../poblacion/poblacion.module';

@Module({
  imports: [PoblacionModule],
  controllers: [ProvinciaController],
  providers: [PrismaService, ProvinciaService],
  exports: [],
})
export class ProvinciaModule {}
