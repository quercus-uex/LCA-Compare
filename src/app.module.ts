import { Module } from '@nestjs/common';
import { UsuarioModule } from './usuario/usuario.module';
import { ConfigModule } from '@nestjs/config';
import { VentumModule } from './ventum/ventum.module';

@Module({
  imports: [ConfigModule.forRoot(), UsuarioModule, VentumModule],
})
export class AppModule {}
