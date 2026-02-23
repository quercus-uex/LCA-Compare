import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Usuario, Prisma } from '../generated/prisma/client';

export type UsuarioPublico = Omit<Usuario, 'passwordHash'>;

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async findOne(
    where: Prisma.UsuarioWhereUniqueInput,
  ): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where,
    });
  }

  async findOnePublic(
    where: Prisma.UsuarioWhereUniqueInput,
  ): Promise<UsuarioPublico | null> {
    return this.prisma.usuario.findUnique({
      where,
      omit: { passwordHash: true },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UsuarioWhereUniqueInput;
    where?: Prisma.UsuarioWhereInput;
    orderBy?: Prisma.UsuarioOrderByWithRelationInput;
  }): Promise<UsuarioPublico[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.usuario.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      omit: { passwordHash: true },
    });
  }

  async create(data: Prisma.UsuarioCreateInput): Promise<UsuarioPublico> {
    return this.prisma.usuario.create({
      data,
      omit: { passwordHash: true },
    });
  }

  async update(params: {
    where: Prisma.UsuarioWhereUniqueInput;
    data: Prisma.UsuarioUpdateInput;
  }): Promise<UsuarioPublico> {
    const { where, data } = params;
    return this.prisma.usuario.update({
      data,
      where,
      omit: { passwordHash: true },
    });
  }

  async delete(where: Prisma.UsuarioWhereUniqueInput): Promise<UsuarioPublico> {
    return this.prisma.usuario.delete({
      where,
      omit: { passwordHash: true },
    });
  }
}
