import { Module } from '@nestjs/common';
import { UsuarioModule } from './usuario/usuario.module';
import { ConfigModule } from '@nestjs/config';
import { CaptureModule } from './capture/capture.module';
import { AuthModule } from './auth/auth.module';
import { ResultadoImpactoModule } from './resultadoimpacto/resultado-impacto.module';
import { CompareModule } from './compare/compare.module';
import { ProvinciaModule } from './provincia/provincia.module';
import { PaisModule } from './pais/pais.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['../../.env', '.env'],
    }),
    UsuarioModule,
    CaptureModule,
    AuthModule,
    ResultadoImpactoModule,
    CompareModule,
    ProvinciaModule,
    PaisModule,
    AiModule,
    AdminModule,
    StatsModule,
  ],
})
export class AppModule {}
