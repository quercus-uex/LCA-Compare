import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import {
  ApiBearerAuth,
  ApiBody,
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
import { UsuarioService } from '../usuario/usuario.service';
import { ParcelaService } from '../parcela/parcela.service';
import { CultivoService } from '../cultivo/cultivo.service';
import { MetodoImpactoService } from '../metodoimpacto/metodoimpacto.service';
import { PaisService } from '../pais/pais.service';
import { ProvinciaService } from '../provincia/provincia.service';
import { PoblacionService } from '../poblacion/poblacion.service';
import * as argon2 from 'argon2';

type Paginated<T> = { data: T[]; total: number };

function textSearch(fields: string[], search: string) {
  if (!search) return undefined;
  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' as const },
    })),
  };
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
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
  ): Promise<Paginated<unknown>> {
    const where = textSearch(['nombre', 'apellidos', 'email', 'rol'], search!);
    const [data, total] = await Promise.all([
      this.usuarioService.findAll({
        where: where as any,
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
      }),
      this.usuarioService.count(where as any),
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
  @ApiBody({ type: Object })
  @ApiOkResponse({ type: ApiResponseDto(UsuarioDto) })
  async createUsuario(@Body() body: Record<string, unknown>) {
    if (body.passwordHash) {
      body.passwordHash = await argon2.hash(body.passwordHash as string, {
        type: argon2.argon2id,
      });
    }
    return { data: await this.usuarioService.create(body as any) };
  }

  @Put('/usuarios/:id')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiBody({ type: Object })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(UsuarioDto) })
  async updateUsuario(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    if (typeof body.passwordHash === 'string') {
      body.passwordHash = await argon2.hash(body.passwordHash, {
        type: argon2.argon2id,
      });
    }
    return {
      data: await this.usuarioService.update({
        where: { id },
        data: body as any,
      }),
    };
  }

  @Delete('/usuarios/:id')
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(UsuarioDto) })
  async deleteUsuario(@Param('id') id: string) {
    return { data: await this.usuarioService.delete({ id }) };
  }

  // ─── Parcelas ───

  @Get('/parcelas')
  @ApiOperation({ summary: 'Listar parcelas con búsqueda y paginación' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOkResponse({ type: ApiResponseArrayDto(ParcelaDto) })
  async getParcelas(
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<Paginated<unknown>> {
    const where = textSearch(
      ['nombre', 'sigpac', 'refCat', 'ptIdParcela', 'idPropietario'],
      search!,
    );
    const [data, total] = await Promise.all([
      this.parcelaService.findMany({
        where: where as any,
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
        include: { cultivos: { orderBy: { fechaInicioCampania: 'desc' } } },
      }),
      this.parcelaService.count(where as any),
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
  @ApiBody({ type: Object })
  @ApiOkResponse({ type: ApiResponseDto(ParcelaDto) })
  async createParcela(@Body() body: Record<string, unknown>) {
    return { data: await this.parcelaService.create(body as any) };
  }

  @Put('/parcelas/:id')
  @ApiOperation({ summary: 'Actualizar una parcela' })
  @ApiBody({ type: Object })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(ParcelaDto) })
  async updateParcela(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return {
      data: await this.parcelaService.update({
        where: { id },
        data: body as any,
      }),
    };
  }

  @Delete('/parcelas/:id')
  @ApiOperation({ summary: 'Eliminar una parcela' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(ParcelaDto) })
  async deleteParcela(@Param('id') id: string) {
    return { data: await this.parcelaService.delete({ id }) };
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
  ): Promise<Paginated<unknown>> {
    const where = textSearch(['tipo', 'idParcela'], search!);
    const [data, total] = await Promise.all([
      this.cultivoService.findMany({
        where: where as any,
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
      }),
      this.cultivoService.count(where as any),
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
  @ApiBody({ type: Object })
  @ApiOkResponse({ type: ApiResponseDto(CultivoDto) })
  async createCultivo(@Body() body: Record<string, unknown>) {
    return { data: await this.cultivoService.create(body as any) };
  }

  @Put('/cultivos/:id')
  @ApiOperation({ summary: 'Actualizar un cultivo' })
  @ApiBody({ type: Object })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(CultivoDto) })
  async updateCultivo(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return {
      data: await this.cultivoService.update({
        where: { id },
        data: body as any,
      }),
    };
  }

  @Delete('/cultivos/:id')
  @ApiOperation({ summary: 'Eliminar un cultivo' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(CultivoDto) })
  async deleteCultivo(@Param('id') id: string) {
    return { data: await this.cultivoService.delete({ id }) };
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
  ): Promise<Paginated<unknown>> {
    const where = textSearch(['id', 'nombre'], search!);
    const [data, total] = await Promise.all([
      this.metodoImpactoService.findMany({
        where: where as any,
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
      }),
      this.metodoImpactoService.count(where as any),
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
  @ApiBody({ type: Object })
  @ApiOkResponse({ type: ApiResponseDto(MetodoImpactoDto) })
  async createMetodoImpacto(@Body() body: Record<string, unknown>) {
    return { data: await this.metodoImpactoService.create(body as any) };
  }

  @Put('/metodos-impacto/:id')
  @ApiOperation({ summary: 'Actualizar un método de impacto' })
  @ApiBody({ type: Object })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(MetodoImpactoDto) })
  async updateMetodoImpacto(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return {
      data: await this.metodoImpactoService.update({
        where: { id },
        data: body as any,
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
  ): Promise<Paginated<unknown>> {
    const where = textSearch(['nombre', 'codigo'], search!);
    const [data, total] = await Promise.all([
      this.paisService.findMany({
        where: where as any,
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
      }),
      this.paisService.count(where as any),
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
  @ApiBody({ type: Object })
  @ApiOkResponse({ type: ApiResponseDto(PaisDto) })
  async createPais(@Body() body: Record<string, unknown>) {
    return { data: await this.paisService.create(body as any) };
  }

  @Put('/paises/:id')
  @ApiOperation({ summary: 'Actualizar un país' })
  @ApiBody({ type: Object })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(PaisDto) })
  async updatePais(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return {
      data: await this.paisService.update({ where: { id }, data: body as any }),
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
  ): Promise<Paginated<unknown>> {
    const where = textSearch(['nombre', 'idPais'], search!);
    const [data, total] = await Promise.all([
      this.provinciaService.findMany({
        where: where as any,
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
      }),
      this.provinciaService.count(where as any),
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
  @ApiBody({ type: Object })
  @ApiOkResponse({ type: ApiResponseDto(ProvinciaDto) })
  async createProvincia(@Body() body: Record<string, unknown>) {
    return { data: await this.provinciaService.create(body as any) };
  }

  @Put('/provincias/:id')
  @ApiOperation({ summary: 'Actualizar una provincia' })
  @ApiBody({ type: Object })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(ProvinciaDto) })
  async updateProvincia(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return {
      data: await this.provinciaService.update({
        where: { id },
        data: body as any,
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
  ): Promise<Paginated<unknown>> {
    const where = textSearch(['nombre', 'idProvincia'], search!);
    const [data, total] = await Promise.all([
      this.poblacionService.findMany({
        where: where as any,
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
      }),
      this.poblacionService.count(where as any),
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
  @ApiBody({ type: Object })
  @ApiOkResponse({ type: ApiResponseDto(PoblacionDto) })
  async createPoblacion(@Body() body: Record<string, unknown>) {
    return { data: await this.poblacionService.create(body as any) };
  }

  @Put('/poblaciones/:id')
  @ApiOperation({ summary: 'Actualizar una población' })
  @ApiBody({ type: Object })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiOkResponse({ type: ApiResponseDto(PoblacionDto) })
  async updatePoblacion(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return {
      data: await this.poblacionService.update({
        where: { id },
        data: body as any,
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
