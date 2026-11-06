import * as argon2 from 'argon2';
import type { Request } from 'express';

export function getBearerToken(request: Request): string | null {
  const authorization = request.headers.authorization;
  if (!authorization) return null;
  const [type, token] = authorization.split(' ');
  return type === 'Bearer' ? token : null;
}

/** Hash argon2id con el que se guardan las contraseñas (`Usuario.passwordHash`) */
export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}
