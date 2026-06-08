import { CaptureController } from './capture.controller';
import { CaptureService } from './capture.service';
import { ResultadoImpactoService } from '../resultadoimpacto/resultado-impacto.service';
import { CaptureInputDto } from './dto/capture-input.dto';

describe('CaptureController', () => {
  let captureService: jest.Mocked<
    Pick<CaptureService, 'checkUsuario' | 'checkParcela' | 'checkCultivo'>
  >;
  let resultadoImpactoService: jest.Mocked<
    Pick<ResultadoImpactoService, 'create'>
  >;
  let controller: CaptureController;

  const fixture: CaptureInputDto = {
    metadatos: {
      usuario: {
        id: 1,
        nombre: 'Ana',
        apellidos: 'García',
        email: 'ana@example.com',
      },
      parcela: {
        id: 10,
        es_sigpac: { provincia: 41, municipio: 91, poligono: 3, parcela: 45 },
        nombre: 'Parcela Ana',
      },
      cultivo: {
        id: 20,
        fecha_inicio_campania: 20250901,
        fecha_fin_campania: 20260831,
        superficie_cultivada: 5.2,
        produccion: 1200,
        consumo_agua: 300,
        ciclo: 1,
        tipo: 'trigo',
      },
    },
    resultado: {
      impacto_fertilizantes: [
        { category: 'GWP', amount: 10, unit: 'kg CO2 eq' },
      ],
      impacto_manejo_cultivo: [
        { category: 'GWP', amount: 5, unit: 'kg CO2 eq' },
      ],
      impacto_pesticidas: [{ category: 'GWP', amount: 2, unit: 'kg CO2 eq' }],
      impacto_sistema_riego: [
        { category: 'GWP', amount: 3, unit: 'kg CO2 eq' },
      ],
      impacto_total: [{ category: 'GWP', amount: 20, unit: 'kg CO2 eq' }],
    },
  };

  beforeEach(() => {
    captureService = {
      checkUsuario: jest.fn(),
      checkParcela: jest.fn(),
      checkCultivo: jest.fn(),
    };
    resultadoImpactoService = {
      create: jest.fn(),
    };
    controller = new CaptureController(
      resultadoImpactoService as unknown as ResultadoImpactoService,
      captureService as unknown as CaptureService,
    );
  });

  it('delegates to checkUsuario, checkParcela, resultadoImpacto.create, and checkCultivo in order', async () => {
    const usuario = { id: 'u1', email: 'ana@example.com' } as any;
    const parcela = { id: 'p1' } as any;
    const resultadoImpacto = { id: 'ri1' } as any;
    const cultivo = { id: 'c1' } as any;

    captureService.checkUsuario.mockResolvedValue(usuario);
    captureService.checkParcela.mockResolvedValue(parcela);
    resultadoImpactoService.create.mockResolvedValue(resultadoImpacto);
    captureService.checkCultivo.mockResolvedValue(cultivo);

    const originalEnv = process.env.DEFAULT_IMPACT_METHOD_UUID;
    process.env.DEFAULT_IMPACT_METHOD_UUID = 'method-uuid-1';
    try {
      await controller.postCaptureData(fixture);
    } finally {
      process.env.DEFAULT_IMPACT_METHOD_UUID = originalEnv;
    }

    expect(captureService.checkUsuario).toHaveBeenCalledWith(
      fixture.metadatos.usuario,
    );
    expect(captureService.checkParcela).toHaveBeenCalledWith(
      'u1',
      fixture.metadatos.parcela,
    );
    expect(resultadoImpactoService.create).toHaveBeenCalledWith({
      datos: expect.any(Object),
      impacto: { connect: { id: 'method-uuid-1' } },
    });
    expect(captureService.checkCultivo).toHaveBeenCalledWith(
      'p1',
      'ri1',
      fixture.metadatos.cultivo,
    );
  });

  it('returns { usuario, parcela, cultivo } from the resolved service records', async () => {
    const usuario = { id: 'u1' } as any;
    const parcela = { id: 'p1' } as any;
    const resultadoImpacto = { id: 'ri1' } as any;
    const cultivo = { id: 'c1' } as any;

    captureService.checkUsuario.mockResolvedValue(usuario);
    captureService.checkParcela.mockResolvedValue(parcela);
    resultadoImpactoService.create.mockResolvedValue(resultadoImpacto);
    captureService.checkCultivo.mockResolvedValue(cultivo);

    const result = await controller.postCaptureData(fixture);

    expect(result).toEqual({ usuario, parcela, cultivo });
  });
});
