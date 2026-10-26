import { CultivoService } from './cultivo.service';

describe('CultivoService', () => {
  let prisma: {
    cultivo: {
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let service: CultivoService;

  beforeEach(() => {
    prisma = {
      cultivo: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new CultivoService(prisma as never);
  });

  describe('findMostRecentByParcelaIdBulk', () => {
    it('calls prisma.cultivo.findMany with idParcela in the provided ids, ordered by parcel and newest campaign first', async () => {
      prisma.cultivo.findMany.mockResolvedValue([]);

      await service.findMostRecentByParcelaIdBulk(['p1', 'p2']);

      expect(prisma.cultivo.findMany).toHaveBeenCalledWith({
        where: { idParcela: { in: ['p1', 'p2'] } },
        orderBy: [{ idParcela: 'asc' }, { fechaInicioCampania: 'desc' }],
      });
    });

    it('keeps only the most recent campaign of each parcel', async () => {
      prisma.cultivo.findMany.mockResolvedValue([
        {
          id: 'c-p1-2024',
          idParcela: 'p1',
          fechaInicioCampania: new Date('2024-03-01'),
        },
        {
          id: 'c-p1-2023',
          idParcela: 'p1',
          fechaInicioCampania: new Date('2023-03-01'),
        },
        {
          id: 'c-p1-2022',
          idParcela: 'p1',
          fechaInicioCampania: new Date('2022-03-01'),
        },
        {
          id: 'c-p2-2023',
          idParcela: 'p2',
          fechaInicioCampania: new Date('2023-09-01'),
        },
        {
          id: 'c-p2-2021',
          idParcela: 'p2',
          fechaInicioCampania: new Date('2021-09-01'),
        },
      ]);

      const result = await service.findMostRecentByParcelaIdBulk(['p1', 'p2']);

      expect(result.map((c) => c.id)).toEqual(['c-p1-2024', 'c-p2-2023']);
    });

    it('picks the most recent campaign among those matching the filter, not the latest overall', async () => {
      const campanias = [
        {
          id: 'c-p1-olivo-2024',
          idParcela: 'p1',
          tipo: 'Olivo',
          fechaInicioCampania: new Date('2024-03-01'),
        },
        {
          id: 'c-p1-tomate-2023',
          idParcela: 'p1',
          tipo: 'Tomate',
          fechaInicioCampania: new Date('2023-03-01'),
        },
        {
          id: 'c-p1-tomate-2021',
          idParcela: 'p1',
          tipo: 'Tomate',
          fechaInicioCampania: new Date('2021-03-01'),
        },
      ];
      // Simula la base de datos: aplica el filtro por tipo y el orden pedido
      prisma.cultivo.findMany.mockImplementation(
        ({ where }: { where: { tipo?: string } }) =>
          Promise.resolve(
            campanias.filter((c) => !where.tipo || c.tipo === where.tipo),
          ),
      );

      const result = await service.findMostRecentByParcelaIdBulk(['p1'], {
        tipo: 'Tomate',
      });

      expect(prisma.cultivo.findMany).toHaveBeenCalledWith({
        where: { tipo: 'Tomate', idParcela: { in: ['p1'] } },
        orderBy: [{ idParcela: 'asc' }, { fechaInicioCampania: 'desc' }],
      });
      expect(result.map((c) => c.id)).toEqual(['c-p1-tomate-2023']);
    });

    it('returns an empty list when the parcels have no campaigns', async () => {
      prisma.cultivo.findMany.mockResolvedValue([]);

      const result = await service.findMostRecentByParcelaIdBulk(['p1']);

      expect(result).toEqual([]);
    });
  });

  describe('deleteWithResultado', () => {
    function mockTransaction(cultivo: {
      id: string;
      idResultadoImpacto: string | null;
    }) {
      const tx = {
        cultivo: { delete: jest.fn().mockResolvedValue(cultivo) },
        resultadoImpacto: { delete: jest.fn().mockResolvedValue({}) },
      };
      prisma.$transaction.mockImplementation(
        (cb: (t: typeof tx) => Promise<unknown>) => cb(tx),
      );
      return tx;
    }

    it('deletes the cultivo and its impact result', async () => {
      const cultivo = { id: 'c1', idResultadoImpacto: 'r1' };
      const tx = mockTransaction(cultivo);

      await expect(service.deleteWithResultado('c1')).resolves.toBe(cultivo);
      expect(tx.cultivo.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
      expect(tx.resultadoImpacto.delete).toHaveBeenCalledWith({
        where: { id: 'r1' },
      });
    });

    it('skips the result when the cultivo has none', async () => {
      const tx = mockTransaction({ id: 'c1', idResultadoImpacto: null });

      await service.deleteWithResultado('c1');
      expect(tx.resultadoImpacto.delete).not.toHaveBeenCalled();
    });
  });
});
