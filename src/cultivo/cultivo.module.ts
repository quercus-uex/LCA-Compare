import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CultivoService } from './cultivo.service';

@Module({
  imports: [],
  controllers: [],
  providers: [PrismaService, CultivoService],
  exports: [CultivoService],
})
export class CultivoModule {}
