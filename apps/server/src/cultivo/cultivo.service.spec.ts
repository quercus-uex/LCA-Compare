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
