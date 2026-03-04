import { Module } from '@nestjs/common';
import { UsuarioModule } from './usuario/usuario.module';
import { ConfigModule } from '@nestjs/config';
import { VentumModule } from './ventum/ventum.module';
import { AuthModule } from './auth/auth.module';
import { ResultadoImpactoModule } from './resultadoimpacto/resultado-impacto.module';
import { CompareModule } from './compare/compare.module';
import { ProvinciaModule } from './provincia/provincia.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UsuarioModule,
    VentumModule,
    AuthModule,
    ResultadoImpactoModule,
    CompareModule,
    ProvinciaModule,
  ],
})
export class AppModule {}
