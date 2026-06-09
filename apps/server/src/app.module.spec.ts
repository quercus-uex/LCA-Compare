import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { AppModule } from './app.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { CaptureModule } from './capture/capture.module';
import { CompareModule } from './compare/compare.module';
import { PaisModule } from './pais/pais.module';
import { ProvinciaModule } from './provincia/provincia.module';
import { ResultadoImpactoModule } from './resultadoimpacto/resultado-impacto.module';
import { StatsModule } from './stats/stats.module';
import { UsuarioModule } from './usuario/usuario.module';

describe('AppModule', () => {
  it('registers the application feature modules used by the API', () => {
    const imports = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      AppModule,
    ) as unknown[];

    expect(imports).toEqual(
      expect.arrayContaining([
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
      ]),
    );
  });
});
