import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminPrismaExceptionFilter } from './admin-prisma-exception.filter';
import { AuthUser, type UserJwt } from '../auth/auth-user.decorator';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { ApiResponseArrayDto } from '../common/dto/api-response-array.dto';
import { UsuarioDto } from '../usuario/dto/usuario.dto';
import { ParcelaDto } from '../parcela/dto/parcela.dto';
import { CultivoDto } from '../cultivo/dto/cultivo.dto';
import { MetodoImpactoDto } from './dto/metodo-impacto.dto';
import { PaisDto } from '../pais/dto/pais.dto';
import { ProvinciaDto } from '../provincia/provincia.dto';
import { PoblacionDto } from '../poblacion/dto/poblacion.dto';
import { CreateCultivoDto } from '../cultivo/dto/create-cultivo.dto';
import { CreateMetodoImpactoDto } from '../metodoimpacto/dto/create-metodo-impacto.dto';
import { CreatePaisDto } from '../pais/dto/create-pais.dto';
import { CreateParcelaDto } from '../parcela/dto/create-parcela.dto';
import { CreatePoblacionDto } from '../poblacion/dto/create-poblacion.dto';
import { CreateProvinciaDto } from '../provincia/dto/create-provincia.dto';
import { CreateUsuarioAdminDto } from './dto/create-usuario-admin.dto';
import { UpdateCultivoDto } from '../cultivo/dto/update-cultivo.dto';
import { UpdateMetodoImpactoDto } from '../metodoimpacto/dto/update-metodo-impacto.dto';
import { UpdatePaisDto } from '../pais/dto/update-pais.dto';
import { UpdateParcelaDto } from '../parcela/dto/update-parcela.dto';
import { UpdatePoblacionDto } from '../poblacion/dto/update-poblacion.dto';
import { UpdateProvinciaDto } from '../provincia/dto/update-provincia.dto';
import { UpdateUsuarioAdminDto } from './dto/update-usuario-admin.dto';
import {
  cultivoAdminSearch,
  metodoImpactoAdminSearch,
  paisAdminSearch,
  parcelaAdminSearch,
  poblacionAdminSearch,
  provinciaAdminSearch,
  usuarioAdminSearch,
  andWhere,
} from './helpers/admin-search.helpers';
import { parseAdminPagination } from './helpers/admin-pagination.helpers';
import { UsuarioService } from '../usuario/usuario.service';
import { ParcelaService } from '../parcela/parcela.service';
import { CultivoService } from '../cultivo/cultivo.service';
import { MetodoImpactoService } from '../metodoimpacto/metodoimpacto.service';
import { PaisService } from '../pais/pais.service';
import { ProvinciaService } from '../provincia/provincia.service';
import { PoblacionService } from '../poblacion/poblacion.service';
import {
  Cultivo,
  MetodoImpacto,
  Pais,
  Parcela,
  Poblacion,
  Provincia,
} from '../generated/prisma/client';
import type { UsuarioPublico } from '../usuario/usuario.service';
import * as argon2 from 'argon2';

type Paginated<T> = { data: T[]; total: number };

const PARCELA_ADMIN_INCLUDE = {
  cultivos: { orderBy: { fechaInicioCampania: 'desc' } },
  propietario: {
    select: { id: true, nombre: true, apellidos: true, email: true },
  },
  poblacion: {
    select: { id: true, nombre: true, provincia: { select: { nombre: true } } },
  },
} as const;

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@UseFilters(AdminPrismaExceptionFilter)
@Controller('/admin')
export class AdminController {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly parcelaService: ParcelaService,
    private readonly cultivoService: CultivoService,
    private readonly metodoImpactoService: MetodoImpactoService,
    private readonly paisService: PaisService,
    private readonly provinciaService: ProvinciaService,
    private readonly poblacionService: PoblacionService,
  ) {}

  // ─── Resumen ───

  @Get('/resumen')
  @ApiOperation({ summary: 'Número de registros de cada entidad del panel' })
  async getResumen() {
    const [
      usuarios,
      parcelas,
      parcelasSinPoblacion,
      cultivos,
      metodosImpacto,
      paises,
      provincias,
      poblaciones,
    ] = await Promise.all([
      this.usuarioService.count(),
      this.parcelaService.count(),
      this.parcelaService.count({ idPoblacion: null }),
      this.cultivoService.count(),
      this.metodoImpactoService.count(),
      this.paisService.count(),
      this.provinciaService.count(),
      this.poblacionService.count(),
    ]);
    return {
      data: {
        usuarios,
        parcelas,
        parcelasSinPoblacion,
        cultivos,
        'metodos-impacto': metodosImpacto,
        paises,
        provincias,
        poblaciones,
      },
    };
  }

  // ─── Usuarios ───

  @Get('/usuarios')
  @ApiOperation({ summary: 'Listar usuarios con búsqueda y paginación' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  @ApiForbiddenResponse({
    description: 'Se requiere rol de administrador',
    type: ApiErrorDto,
  })
  @ApiOkResponse({ type: ApiResponseArrayDto(UsuarioDto) })
  async getUsuarios(
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<Paginated<UsuarioPublico>> {
    const where = usuarioAdminSearch(search);
    const [data, total] = await Promise.all([
      this.usuarioService.findAll({
        where,
        orderBy: [{ nombre: 'asc' }, { apellidos: 'asc' }, { id: 'asc' }],
        ...parseAdminPagination(skip, take),
      }),
      this.usuarioService.count(where),
    ]);
    return { data, total };
  }

  @Get('/usuarios/:id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(UsuarioDto) })
  async getUsuario(@Param('id') id: string) {
    const usuario = await this.usuarioService.findOnePublic({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return { data: usuario };
  }

  @Post('/usuarios')
  @ApiOperation({ summary: 'Crear un usuario' })
  @ApiOkResponse({ type: ApiResponseDto(UsuarioDto) })
  async createUsuario(@Body() body: CreateUsuarioAdminDto) {
    const data = {
      ...body,
      passwordHash: await argon2.hash(body.passwordHash, {
        type: argon2.argon2id,
      }),
    };
    return { data: await this.usuarioService.create(data) };
  }

  @Put('/usuarios/:id')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(UsuarioDto) })
  async updateUsuario(
    @AuthUser() user: UserJwt,
    @Param('id') id: string,
    @Body() body: UpdateUsuarioAdminDto,
  ) {
    if (id === user.sub && body.rol && body.rol !== 'admin') {
      throw new BadRequestException(
        'No puedes quitarte el rol de administrador a ti mismo',
      );
    }
    const data = { ...body };
    if (typeof body.passwordHash === 'string') {
      data.passwordHash = await argon2.hash(body.passwordHash, {
        type: argon2.argon2id,
      });
    }
    return {
      data: await this.usuarioService.update({
        where: { id },
        data,
      }),
    };
  }

  @Delete('/usuarios/:id')
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(UsuarioDto) })
  async deleteUsuario(@AuthUser() user: UserJwt, @Param('id') id: string) {
    if (id === user.sub) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta');
    }
    return { data: await this.usuarioService.delete({ id }) };
  }

  // ─── Parcelas ───

  @Get('/parcelas')
  @ApiOperation({ summary: 'Listar parcelas con búsqueda y paginación' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({
    name: 'sinPoblacion',
    required: false,
    type: Boolean,
    description: 'Solo parcelas sin población asignada',
  })
  @ApiOkResponse({ type: ApiResponseArrayDto(ParcelaDto) })
  async getParcelas(
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('sinPoblacion') sinPoblacion?: string,
  ): Promise<Paginated<Parcela>> {
    const where = andWhere(
      parcelaAdminSearch(search),
      sinPoblacion === 'true' ? { idPoblacion: null } : undefined,
    );
    const [data, total] = await Promise.all([
      this.parcelaService.findMany({
        where,
        ...parseAdminPagination(skip, take),
        orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
        include: PARCELA_ADMIN_INCLUDE,
      }),
      this.parcelaService.count(where),
    ]);
    return { data, total };
  }

  @Get('/parcelas/:id')
  @ApiOperation({ summary: 'Obtener una parcela por ID' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(ParcelaDto) })
  async getParcela(@Param('id') id: string) {
    const parcela = await this.parcelaService.findOne({ id });
    if (!parcela) throw new NotFoundException('Parcela no encontrada');
    return { data: parcela };
  }

  @Post('/parcelas')
  @ApiOperation({ summary: 'Crear una parcela' })
  @ApiOkResponse({ type: ApiResponseDto(ParcelaDto) })
  async createParcela(@Body() body: CreateParcelaDto) {
    return { data: await this.parcelaService.create(body) };
  }

  @Put('/parcelas/:id')
  @ApiOperation({ summary: 'Actualizar una parcela' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(ParcelaDto) })
  async updateParcela(@Param('id') id: string, @Body() body: UpdateParcelaDto) {
    return {
      data: await this.parcelaService.update({
        where: { id },
        data: body,
      }),
    };
  }

  @Delete('/parcelas/:id')
  @ApiOperation({
    summary: 'Eliminar una parcela con sus cultivos y resultados de impacto',
  })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(ParcelaDto) })
  async deleteParcela(@Param('id') id: string) {
    return { data: await this.parcelaService.deleteWithCultivos(id) };
  }

  // ─── Cultivos ───

  @Get('/cultivos')
  @ApiOperation({ summary: 'Listar cultivos con búsqueda y paginación' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOkResponse({ type: ApiResponseArrayDto(CultivoDto) })
  async getCultivos(
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<Paginated<Cultivo>> {
    const where = cultivoAdminSearch(search);
    const [data, total] = await Promise.all([
      this.cultivoService.findMany({
        where,
        ...parseAdminPagination(skip, take),
        orderBy: [{ fechaInicioCampania: 'desc' }, { id: 'asc' }],
        include: { parcela: { select: { id: true, nombre: true } } },
      }),
      this.cultivoService.count(where),
    ]);
    return { data, total };
  }

  @Get('/cultivos/:id')
  @ApiOperation({ summary: 'Obtener un cultivo por ID' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(CultivoDto) })
  async getCultivo(@Param('id') id: string) {
    const cultivo = await this.cultivoService.findOne({ id });
    if (!cultivo) throw new NotFoundException('Cultivo no encontrado');
    return { data: cultivo };
  }

  @Post('/cultivos')
  @ApiOperation({ summary: 'Crear un cultivo' })
  @ApiOkResponse({ type: ApiResponseDto(CultivoDto) })
  async createCultivo(@Body() body: CreateCultivoDto) {
    return { data: await this.cultivoService.create(body) };
  }

  @Put('/cultivos/:id')
  @ApiOperation({ summary: 'Actualizar un cultivo' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(CultivoDto) })
  async updateCultivo(@Param('id') id: string, @Body() body: UpdateCultivoDto) {
    return {
      data: await this.cultivoService.update({
        where: { id },
        data: body,
      }),
    };
  }

  @Delete('/cultivos/:id')
  @ApiOperation({ summary: 'Eliminar un cultivo y su resultado de impacto' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(CultivoDto) })
  async deleteCultivo(@Param('id') id: string) {
    return { data: await this.cultivoService.deleteWithResultado(id) };
  }

  // ─── Métodos de Impacto ───

  @Get('/metodos-impacto')
  @ApiOperation({
    summary: 'Listar métodos de impacto con búsqueda y paginación',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOkResponse({ type: ApiResponseArrayDto(MetodoImpactoDto) })
  async getMetodosImpacto(
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<Paginated<MetodoImpacto>> {
    const where = metodoImpactoAdminSearch(search);
    const [data, total] = await Promise.all([
      this.metodoImpactoService.findMany({
        where,
        ...parseAdminPagination(skip, take),
        orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
      }),
      this.metodoImpactoService.count(where),
    ]);
    return { data, total };
  }

  @Get('/metodos-impacto/:id')
  @ApiOperation({ summary: 'Obtener un método de impacto por ID' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(MetodoImpactoDto) })
  async getMetodoImpacto(@Param('id') id: string) {
    const metodo = await this.metodoImpactoService.findOne({ id });
    if (!metodo) throw new NotFoundException('Método de impacto no encontrado');
    return { data: metodo };
  }

  @Post('/metodos-impacto')
  @ApiOperation({ summary: 'Crear un método de impacto' })
  @ApiOkResponse({ type: ApiResponseDto(MetodoImpactoDto) })
  async createMetodoImpacto(@Body() body: CreateMetodoImpactoDto) {
    return { data: await this.metodoImpactoService.create(body) };
  }

  @Put('/metodos-impacto/:id')
  @ApiOperation({ summary: 'Actualizar un método de impacto' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(MetodoImpactoDto) })
  async updateMetodoImpacto(
    @Param('id') id: string,
    @Body() body: UpdateMetodoImpactoDto,
  ) {
    return {
      data: await this.metodoImpactoService.update({
        where: { id },
        data: body,
      }),
    };
  }

  @Delete('/metodos-impacto/:id')
  @ApiOperation({ summary: 'Eliminar un método de impacto' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(MetodoImpactoDto) })
  async deleteMetodoImpacto(@Param('id') id: string) {
    return { data: await this.metodoImpactoService.delete({ id }) };
  }

  // ─── Países ───

  @Get('/paises')
  @ApiOperation({ summary: 'Listar países con búsqueda y paginación' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOkResponse({ type: ApiResponseArrayDto(PaisDto) })
  async getPaises(
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<Paginated<Pais>> {
    const where = paisAdminSearch(search);
    const [data, total] = await Promise.all([
      this.paisService.findMany({
        where,
        ...parseAdminPagination(skip, take),
        orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
      }),
      this.paisService.count(where),
    ]);
    return { data, total };
  }

  @Get('/paises/:id')
  @ApiOperation({ summary: 'Obtener un país por ID' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(PaisDto) })
  async getPais(@Param('id') id: string) {
    const pais = await this.paisService.findOne({ id });
    if (!pais) throw new NotFoundException('País no encontrado');
    return { data: pais };
  }

  @Post('/paises')
  @ApiOperation({ summary: 'Crear un país' })
  @ApiOkResponse({ type: ApiResponseDto(PaisDto) })
  async createPais(@Body() body: CreatePaisDto) {
    return { data: await this.paisService.create(body) };
  }

  @Put('/paises/:id')
  @ApiOperation({ summary: 'Actualizar un país' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(PaisDto) })
  async updatePais(@Param('id') id: string, @Body() body: UpdatePaisDto) {
    return {
      data: await this.paisService.update({ where: { id }, data: body }),
    };
  }

  @Delete('/paises/:id')
  @ApiOperation({ summary: 'Eliminar un país' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(PaisDto) })
  async deletePais(@Param('id') id: string) {
    return { data: await this.paisService.delete({ id }) };
  }

  // ─── Provincias ───

  @Get('/provincias')
  @ApiOperation({ summary: 'Listar provincias con búsqueda y paginación' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOkResponse({ type: ApiResponseArrayDto(ProvinciaDto) })
  async getProvincias(
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<Paginated<Provincia>> {
    const where = provinciaAdminSearch(search);
    const [data, total] = await Promise.all([
      this.provinciaService.findMany({
        where,
        ...parseAdminPagination(skip, take),
        orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
        include: { pais: { select: { id: true, nombre: true } } },
      }),
      this.provinciaService.count(where),
    ]);
    return { data, total };
  }

  @Get('/provincias/:id')
  @ApiOperation({ summary: 'Obtener una provincia por ID' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(ProvinciaDto) })
  async getProvincia(@Param('id') id: string) {
    const provincia = await this.provinciaService.findOne({ id });
    if (!provincia) throw new NotFoundException('Provincia no encontrada');
    return { data: provincia };
  }

  @Post('/provincias')
  @ApiOperation({ summary: 'Crear una provincia' })
  @ApiOkResponse({ type: ApiResponseDto(ProvinciaDto) })
  async createProvincia(@Body() body: CreateProvinciaDto) {
    return { data: await this.provinciaService.create(body) };
  }

  @Put('/provincias/:id')
  @ApiOperation({ summary: 'Actualizar una provincia' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(ProvinciaDto) })
  async updateProvincia(
    @Param('id') id: string,
    @Body() body: UpdateProvinciaDto,
  ) {
    return {
      data: await this.provinciaService.update({
        where: { id },
        data: body,
      }),
    };
  }

  @Delete('/provincias/:id')
  @ApiOperation({ summary: 'Eliminar una provincia' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(ProvinciaDto) })
  async deleteProvincia(@Param('id') id: string) {
    return { data: await this.provinciaService.delete({ id }) };
  }

  // ─── Poblaciones ───

  @Get('/poblaciones')
  @ApiOperation({ summary: 'Listar poblaciones con búsqueda y paginación' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOkResponse({ type: ApiResponseArrayDto(PoblacionDto) })
  async getPoblaciones(
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<Paginated<Poblacion>> {
    const where = poblacionAdminSearch(search);
    const [data, total] = await Promise.all([
      this.poblacionService.findMany({
        where,
        ...parseAdminPagination(skip, take),
        orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
      }),
      this.poblacionService.count(where),
    ]);
    return { data, total };
  }

  @Get('/poblaciones/:id')
  @ApiOperation({ summary: 'Obtener una población por ID' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(PoblacionDto) })
  async getPoblacion(@Param('id') id: string) {
    const poblacion = await this.poblacionService.findOne({ id });
    if (!poblacion) throw new NotFoundException('Población no encontrada');
    return { data: poblacion };
  }

  @Post('/poblaciones')
  @ApiOperation({ summary: 'Crear una población' })
  @ApiOkResponse({ type: ApiResponseDto(PoblacionDto) })
  async createPoblacion(@Body() body: CreatePoblacionDto) {
    return { data: await this.poblacionService.create(body) };
  }

  @Put('/poblaciones/:id')
  @ApiOperation({ summary: 'Actualizar una población' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(PoblacionDto) })
  async updatePoblacion(
    @Param('id') id: string,
    @Body() body: UpdatePoblacionDto,
  ) {
    return {
      data: await this.poblacionService.update({
        where: { id },
        data: body,
      }),
    };
  }

  @Delete('/poblaciones/:id')
  @ApiOperation({ summary: 'Eliminar una población' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(PoblacionDto) })
  async deletePoblacion(@Param('id') id: string) {
    return { data: await this.poblacionService.delete({ id }) };
  }
}
