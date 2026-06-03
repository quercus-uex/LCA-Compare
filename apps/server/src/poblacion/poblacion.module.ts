import { Module } from '@nestjs/common';
import { PoblacionService } from './poblacion.service';
import { PrismaService } from '../prisma/prisma.service';
import { PoblacionController } from './poblacion.controller';

@Module({
  imports: [],
  controllers: [PoblacionController],
  providers: [PrismaService, PoblacionService],
  exports: [PoblacionService],
})
export class PoblacionModule {}
