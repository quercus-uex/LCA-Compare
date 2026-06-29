import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CaptureInputDto, SigpacDto } from './capture-input.dto';

function validPayload() {
  const impact = {
    category: 'Climate change',
    amount: 12.5,
    unit: 'kg CO2 eq',
  };
  return {
    metadatos: {
      parcela: {
        id: 1,
        es_sigpac: {
          provincia: 41,
          municipio: 91,
          poligono: 3,
          parcela: 45,
        },
        nombre: 'Parcela de ensayo',
      },
      cultivo: {
        id: 2,
        fecha_inicio_campania: 20240101,
        fecha_fin_campania: 20241231,
        superficie_cultivada: 10,
        produccion: 1200,
        consumo_agua: 300,
        ciclo: 1,
        tipo: 'trigo',
      },
      usuario: {
        id: 3,
        nombre: 'Ana',
        email: 'ana@example.com',
      },
    },
    resultado: {
      impacto_fertilizantes: [impact],
      impacto_manejo_cultivo: [impact],
      impacto_pesticidas: [impact],
      impacto_sistema_riego: [impact],
      impacto_total: [impact],
    },
  };
}

describe('CaptureInputDto', () => {
  it('accepts a valid nested capture payload and materializes nested DTO instances', () => {
    const dto = plainToInstance(CaptureInputDto, validPayload());

    expect(validateSync(dto)).toEqual([]);
    expect(dto.metadatos.parcela.es_sigpac).toBeInstanceOf(SigpacDto);
    expect(dto.metadatos.cultivo.constructor.name).toBe('MetadatosCultivoDto');
    expect(dto.resultado.impacto_total[0].constructor.name).toBe('ImpactoDto');
  });

  it('rejects invalid nested metadata and empty impact arrays', () => {
    const payload = validPayload();
    payload.metadatos.usuario.email = 'not-an-email';
    payload.metadatos.cultivo.superficie_cultivada = Number.NaN;
    payload.resultado.impacto_total = [];

    const dto = plainToInstance(CaptureInputDto, payload);
    const errors = validateSync(dto);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'metadatos' }),
        expect.objectContaining({ property: 'resultado' }),
      ]),
    );
  });
});
