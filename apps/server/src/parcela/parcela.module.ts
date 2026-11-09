import { Module } from '@nestjs/common';
import { ParcelaService } from './parcela.service';
import { PrismaService } from '../prisma/prisma.service';
import { ParcelaController } from './parcela.controller';
import { OrganizacionAccesoModule } from '../organizacion/organizacion-acceso.module';

@Module({
  imports: [OrganizacionAccesoModule],
  controllers: [ParcelaController],
  providers: [PrismaService, ParcelaService],
  exports: [ParcelaService],
})
export class ParcelaModule {}
