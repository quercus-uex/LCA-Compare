import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CAMPANIA_MIN_ANIO, campaniaMaxAnio } from 'common/organizacion';
import {
  CreateOrganizacionDto,
  UpdateOrganizacionDto,
} from './create-organizacion.dto';
import { SolicitarConsentimientoDto } from './solicitar-consentimiento.dto';
import { ResponderConsentimientosDto } from './responder-consentimientos.dto';
import { MarcarAvisosLeidosDto } from './marcar-avisos-leidos.dto';
import { TransferirOrganizacionDto } from './transferir-organizacion.dto';

const UUID = '11111111-1111-4111-8111-111111111111';

async function parse<T extends object>(
  cls: new () => T,
  body: Record<string, unknown>,
) {
  const dto = plainToInstance(cls, body);
  const errors = await validate(dto, { whitelist: true });
  return { dto, errors: errors.map((e) => e.property) };
}

describe('organization DTOs', () => {
  describe('CreateOrganizacionDto', () => {
    it('trims the name and the description', async () => {
      const { dto, errors } = await parse(CreateOrganizacionDto, {
        nombre: '  Cooperativa  ',
        descripcion: '  Sur ',
      });

      expect(errors).toEqual([]);
      expect(dto).toEqual({ nombre: 'Cooperativa', descripcion: 'Sur' });
    });

    it.each([
      [{}, ['nombre']],
      [{ nombre: '   ' }, ['nombre']],
      [{ nombre: 'x'.repeat(121) }, ['nombre']],
      [{ nombre: 'Coop', descripcion: 'x'.repeat(501) }, ['descripcion']],
      [{ nombre: 'Coop', descripcion: '' }, []],
    ])('validates %p', async (body, errors) => {
      expect((await parse(CreateOrganizacionDto, body)).errors).toEqual(errors);
    });
  });

  describe('UpdateOrganizacionDto', () => {
    it.each([
      [{}, []],
      [{ descripcion: '' }, []],
      [{ nombre: ' ' }, ['nombre']],
    ])('validates %p', async (body, errors) => {
      expect((await parse(UpdateOrganizacionDto, body)).errors).toEqual(errors);
    });
  });

  describe('SolicitarConsentimientoDto', () => {
    it('normalizes the email before validating it', async () => {
      const { dto, errors } = await parse(SolicitarConsentimientoDto, {
        email: '  Ana@Example.COM ',
        anios: [2024],
      });

      expect(errors).toEqual([]);
      expect(dto.email).toBe('ana@example.com');
    });

    it.each([
      [[CAMPANIA_MIN_ANIO, campaniaMaxAnio()], []],
      [[], ['anios']],
      [[2024, 2024], ['anios']],
      [[CAMPANIA_MIN_ANIO - 1], ['anios']],
      [[campaniaMaxAnio() + 1], ['anios']],
      [[2024.5], ['anios']],
      ['2024', ['anios']],
    ])('validates the years %p', async (anios, errors) => {
      const result = await parse(SolicitarConsentimientoDto, {
        email: 'ana@example.com',
        anios,
      });
      expect(result.errors).toEqual(errors);
    });

    it('rejects an invalid email', async () => {
      const result = await parse(SolicitarConsentimientoDto, {
        email: 'no-es-un-email',
        anios: [2024],
      });
      expect(result.errors).toEqual(['email']);
    });
  });

  describe('ResponderConsentimientosDto', () => {
    it.each([
      [{ ids: [UUID], respuesta: 'aceptado' }, []],
      [{ ids: [UUID], respuesta: 'rechazado' }, []],
      [{ ids: [], respuesta: 'aceptado' }, ['ids']],
      [{ ids: ['x'], respuesta: 'aceptado' }, ['ids']],
      [{ ids: [UUID], respuesta: 'revocado' }, ['respuesta']],
    ])('validates %p', async (body, errors) => {
      expect((await parse(ResponderConsentimientosDto, body)).errors).toEqual(
        errors,
      );
    });
  });

  describe('MarcarAvisosLeidosDto', () => {
    it.each([
      [{}, []],
      [{ ids: [UUID] }, []],
      [{ ids: ['x'] }, ['ids']],
    ])('validates %p', async (body, errors) => {
      expect((await parse(MarcarAvisosLeidosDto, body)).errors).toEqual(errors);
    });
  });

  describe('TransferirOrganizacionDto', () => {
    it.each([
      [{ idUsuario: UUID }, []],
      [{ idUsuario: 'x' }, ['idUsuario']],
    ])('validates %p', async (body, errors) => {
      expect((await parse(TransferirOrganizacionDto, body)).errors).toEqual(
        errors,
      );
    });
  });
});
