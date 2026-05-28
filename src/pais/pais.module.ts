import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaisService } from './pais.service';
import { PaisController } from './pais.controller';

@Module({
  imports: [],
  controllers: [PaisController],
  providers: [PrismaService, PaisService],
  exports: [PaisService],
})
export class PaisModule {}
