import * as dotenv from 'dotenv';
import * as path from 'node:path';
import * as argon2 from 'argon2';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const ADMIN_ROLE = 'admin';

function printUsage() {
  console.log(`
Uso:
  pnpm admin:create -- --email="admin@example.com" --password="secreto" --nombre="Admin" --apellidos="Plataforma"

Variables de entorno requeridas:
  DATABASE_URL  URL de conexión a PostgreSQL (ej: postgresql://user:pass@localhost:5432/dbname)
`);
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (const arg of argv) {
    const match = arg.match(/^--([a-zA-Z]+)=(.*)$/);
    if (match) {
      args[match[1]] = match[2];
    }
  }
  return args;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function createAdmin() {
  const args = parseArgs(process.argv.slice(2));

  const email = args.email?.trim();
  const password = args.password;
  const nombre = args.nombre?.trim();
  const apellidos = args.apellidos?.trim();

  if (!email || !password || !nombre || !apellidos) {
    printUsage();
    process.exit(1);
  }

  if (!validateEmail(email)) {
    console.error('Error: el email proporcionado no es válido.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: la contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Error: DATABASE_URL no está definida en el entorno.');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      console.error(`Error: ya existe un usuario con el email ${email}.`);
      process.exit(1);
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const user = await prisma.usuario.create({
      data: {
        nombre,
        apellidos,
        email,
        passwordHash,
        rol: ADMIN_ROLE,
      },
      omit: { passwordHash: true },
    });

    console.log('Usuario administrador creado correctamente:');
    console.log(`  ID:        ${user.id}`);
    console.log(`  Nombre:    ${user.nombre} ${user.apellidos}`);
    console.log(`  Email:     ${user.email}`);
    console.log(`  Rol:       ${user.rol}`);
    console.log(`  Creado:    ${user.fechaRegistro.toISOString()}`);
  } catch (error) {
    console.error('Error inesperado al crear el administrador:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin().catch((error) => {
  console.error('Error no controlado:', error);
  process.exit(1);
});
