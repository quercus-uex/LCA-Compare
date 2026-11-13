import { Module } from '@nestjs/common';
import { UsuarioModule } from '../usuario/usuario.module';
import { ParcelaModule } from '../parcela/parcela.module';
import { CultivoModule } from '../cultivo/cultivo.module';
import { MetodoImpactoModule } from '../metodoimpacto/metodoimpacto.module';
import { PaisModule } from '../pais/pais.module';
import { ProvinciaModule } from '../provincia/provincia.module';
import { PoblacionModule } from '../poblacion/poblacion.module';
import { OrganizacionModule } from '../organizacion/organizacion.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    UsuarioModule,
    ParcelaModule,
    CultivoModule,
    MetodoImpactoModule,
    PaisModule,
    ProvinciaModule,
    PoblacionModule,
    OrganizacionModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
