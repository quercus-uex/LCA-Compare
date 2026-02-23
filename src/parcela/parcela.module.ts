import { Module } from '@nestjs/common';
import { ParcelaService } from './parcela.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [],
  providers: [PrismaService, ParcelaService],
  exports: [ParcelaService],
})
export class ParcelaModule {}
