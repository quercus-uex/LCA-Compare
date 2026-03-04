import { Module } from '@nestjs/common';
import { VentumController } from './ventum.controller';
import { SigpacService } from '../sigpac/sigpac.service';
import { HttpModule } from '@nestjs/axios';
import { CatastroService } from '../catastro/catastro.service';
import { UsuarioModule } from '../usuario/usuario.module';
import { ParcelaModule } from '../parcela/parcela.module';
import { CultivoModule } from '../cultivo/cultivo.module';
import { ResultadoImpactoModule } from '../resultadoimpacto/resultado-impacto.module';

@Module({
  imports: [
    HttpModule,
    UsuarioModule,
    ParcelaModule,
    CultivoModule,
    ResultadoImpactoModule,
  ],
  controllers: [VentumController],
  providers: [SigpacService, CatastroService],
})
export class VentumModule {}
