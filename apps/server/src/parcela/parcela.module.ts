import { Module } from '@nestjs/common';
import { ParcelaService } from './parcela.service';
import { PrismaService } from '../prisma/prisma.service';
import { ParcelaController } from './parcela.controller';

@Module({
  imports: [],
  controllers: [ParcelaController],
  providers: [PrismaService, ParcelaService],
  exports: [ParcelaService],
})
export class ParcelaModule {}
