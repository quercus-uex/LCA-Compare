import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerModule } from '../mailer/mailer.module';
import { ParcelaModule } from '../parcela/parcela.module';
import { OrganizacionAccesoModule } from './organizacion-acceso.module';
import { OrganizacionService } from './organizacion.service';
import { NotificacionService } from './notificacion.service';
import { OrganizacionController } from './organizacion.controller';
import { NotificacionController } from './notificacion.controller';
import { OrganizacionAdminGuard } from './organizacion-admin.guard';

@Module({
  imports: [MailerModule, ParcelaModule, OrganizacionAccesoModule],
  controllers: [OrganizacionController, NotificacionController],
  providers: [
    PrismaService,
    OrganizacionService,
    NotificacionService,
    OrganizacionAdminGuard,
  ],
  exports: [OrganizacionService],
})
export class OrganizacionModule {}
