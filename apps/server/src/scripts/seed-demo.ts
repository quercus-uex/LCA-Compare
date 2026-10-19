import * as dotenv from 'dotenv';
import * as path from 'node:path';
import * as argon2 from 'argon2';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { generateDemoData } from './demo-data';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const DEFAULT_IMPACT_METHOD_UUID = '2f995579-06bd-4681-b07c-cee3b1805b0d';

function printUsage() {
  console.log(`
Seeds an EMPTY database with synthetic data for a demo instance: an
administrator, sample farmers, plots in Spain and Portugal, and several
campaigns with LCA results per plot.

Usage:
  pnpm demo:seed

Required environment variables:
  DATABASE_URL          PostgreSQL connection URL
  DEMO_ADMIN_EMAIL      Email of the demo administrator
  DEMO_PASSWORD         Password (min. 8 characters) for the administrator and
                        all sample users

Optional:
  DEFAULT_IMPACT_METHOD_UUID  Impact method for the results (EF 3.1 by default)
`);
}

async function seedDemo() {
  const databaseUrl = process.env.DATABASE_URL;
  const adminEmail = process.env.DEMO_ADMIN_EMAIL?.trim();
  const password = process.env.DEMO_PASSWORD;
  const idImpacto =
    process.env.DEFAULT_IMPACT_METHOD_UUID || DEFAULT_IMPACT_METHOD_UUID;

  if (!databaseUrl || !adminEmail || !password) {
    printUsage();
    process.exit(1);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    console.error('Error: DEMO_ADMIN_EMAIL is not a valid email.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: DEMO_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    // Guard against running it by mistake on a real database
    const usuarios = await prisma.usuario.count();
    if (usuarios > 0) {
      console.error(
        `Error: the database already has ${usuarios} user(s). This script only seeds empty instances.`,
      );
      process.exit(1);
    }

    const metodo = await prisma.metodoImpacto.findUnique({
      where: { id: idImpacto },
    });
    if (!metodo) {
      console.error(
        `Error: impact method ${idImpacto} does not exist. Have the migrations been applied?`,
      );
      process.exit(1);
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const data = generateDemoData();

    let numParcelas = 0;
    let numCultivos = 0;

    await prisma.$transaction(
      async (tx) => {
        await tx.usuario.create({
          data: {
            nombre: 'Admin',
            apellidos: 'Demo',
            email: adminEmail,
            passwordHash,
            rol: 'admin',
          },
        });

        for (const usuario of data) {
          const { id: idPropietario } = await tx.usuario.create({
            data: {
              nombre: usuario.nombre,
              apellidos: usuario.apellidos,
              email: usuario.email,
              passwordHash,
              rol: 'usuario',
            },
          });

          for (const parcela of usuario.parcelas) {
            const { pais, provincia, poblacion } = parcela.municipio;
            const { id: idPoblacion } = await tx.poblacion.findFirstOrThrow({
              where: {
                idCatastro: poblacion,
                provincia: { idCatastro: provincia, pais: { codigo: pais } },
              },
              select: { id: true },
            });

            const { id: idParcela } = await tx.parcela.create({
              data: {
                nombre: parcela.nombre,
                esParcelaReferencia: parcela.esParcelaReferencia,
                idPropietario,
                idPoblacion,
              },
            });
            await tx.$executeRaw`
              UPDATE "Parcela"
              SET "geom" = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(parcela.geom)}), 4326)
              WHERE "id" = ${idParcela}
            `;
            numParcelas++;

            for (const { resultado, ...cultivo } of parcela.cultivos) {
              const { id: idResultadoImpacto } =
                await tx.resultadoImpacto.create({
                  data: { datos: resultado, idImpacto },
                });
              await tx.cultivo.create({
                data: { ...cultivo, idParcela, idResultadoImpacto },
              });
              numCultivos++;
            }
          }
        }
      },
      { timeout: 120_000 },
    );

    console.log('Demo instance seeded successfully:');
    console.log(`  Users:      ${data.length + 1}`);
    console.log(`  Plots:      ${numParcelas}`);
    console.log(`  Campaigns:  ${numCultivos}`);
    console.log('');
    console.log('Logins (all with DEMO_PASSWORD):');
    console.log(`  admin    ${adminEmail}`);
    for (const usuario of data) {
      console.log(`  user     ${usuario.email}`);
    }
  } catch (error) {
    console.error('Unexpected error while seeding the demo:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemo().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
