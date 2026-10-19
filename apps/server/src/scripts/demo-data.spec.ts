import {
  DEMO_IMPACT_KEYS,
  MUNICIPIOS,
  PRIMER_ANIO,
  ULTIMO_ANIO,
  generateDemoData,
} from './demo-data';

describe('generateDemoData', () => {
  const data = generateDemoData();
  const parcelas = data.flatMap((u) => u.parcelas);
  const cultivos = parcelas.flatMap((p) => p.cultivos);

  it('is deterministic for the same seed', () => {
    expect(JSON.stringify(generateDemoData())).toBe(JSON.stringify(data));
    expect(JSON.stringify(generateDemoData(1))).not.toBe(JSON.stringify(data));
  });

  it('assigns every demo municipality to some plot', () => {
    const usados = new Set(parcelas.map((p) => p.municipio.nombre));
    expect(usados).toEqual(new Set(MUNICIPIOS.map((m) => m.nombre)));
  });

  it('uses unique emails and unique campaign dates per plot', () => {
    expect(new Set(data.map((u) => u.email)).size).toBe(data.length);
    for (const parcela of parcelas) {
      const fechas = parcela.cultivos.map((c) =>
        c.fechaInicioCampania.getTime(),
      );
      expect(new Set(fechas).size).toBe(fechas.length);
    }
  });

  it('keeps campaigns inside the supported year range', () => {
    for (const cultivo of cultivos) {
      const anio = cultivo.fechaInicioCampania.getUTCFullYear();
      expect(anio).toBeGreaterThanOrEqual(PRIMER_ANIO);
      expect(anio).toBeLessThanOrEqual(ULTIMO_ANIO);
    }
  });

  it('marks exactly one reference plot per crop type', () => {
    const tipos = new Set(cultivos.map((c) => c.tipo));
    const referencias = parcelas.filter((p) => p.esParcelaReferencia);
    expect(referencias).toHaveLength(tipos.size);
    expect(new Set(referencias.map((p) => p.cultivos[0].tipo))).toEqual(tipos);
  });

  it('builds closed polygons', () => {
    for (const { geom } of parcelas) {
      const ring = geom.coordinates[0];
      expect(ring).toHaveLength(5);
      expect(ring[4]).toEqual(ring[0]);
    }
  });

  it('computes impacto_total as the sum of the components', () => {
    for (const { resultado } of cultivos) {
      resultado.impacto_total.forEach((total, i) => {
        const sum = DEMO_IMPACT_KEYS.reduce(
          (acc, key) => acc + resultado[key][i].amount,
          0,
        );
        expect(total.category).toBe(
          resultado.impacto_fertilizantes[i].category,
        );
        // El total se redondea a 3 cifras significativas
        expect(Math.abs(total.amount - sum) / sum).toBeLessThan(0.005);
        expect(total.amount).toBeGreaterThan(0);
      });
    }
  });
});
