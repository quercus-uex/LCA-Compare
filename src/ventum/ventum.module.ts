import { Module } from '@nestjs/common';
import { VentumController } from './ventum.controller';
import { SigpacService } from '../sigpac/sigpac.service';
import { HttpModule } from '@nestjs/axios';
import { CatastroService } from '../catastro/catastro.service';
import { UsuarioModule } from '../usuario/usuario.module';
import { ParcelaModule } from '../parcela/parcela.module';
import { CultivoModule } from '../cultivo/cultivo.module';
import { ResultadoImpactoModule } from '../resultadoimpacto/resultado-impacto.module';
import { PoblacionModule } from '../poblacion/poblacion.module';
import { VentumService } from './ventum.service';
import { MailerModule } from '../mailer/mailer.module';
import { PredialService } from '../predial/predial.service';

@Module({
  imports: [
    HttpModule,
    UsuarioModule,
    ParcelaModule,
    CultivoModule,
    ResultadoImpactoModule,
    PoblacionModule,
    MailerModule,
  ],
  controllers: [VentumController],
  providers: [VentumService, SigpacService, CatastroService, PredialService],
})
export class VentumModule {}
