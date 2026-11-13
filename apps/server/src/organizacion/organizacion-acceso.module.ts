import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizacionAccesoService } from './organizacion-acceso.service';

@Module({
  providers: [PrismaService, OrganizacionAccesoService],
  exports: [OrganizacionAccesoService],
})
export class OrganizacionAccesoModule {}
