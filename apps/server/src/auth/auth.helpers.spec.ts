import * as argon2 from 'argon2';
import type { Request } from 'express';
import { getBearerToken, hashPassword } from './auth.helpers';

describe('auth helpers', () => {
  it.each([
    [undefined, null],
    ['Basic credentials', null],
    ['Bearer token-1', 'token-1'],
  ])('getBearerToken reads %p as %p', (authorization, expected) => {
    const request = { headers: { authorization } } as Request;

    expect(getBearerToken(request)).toBe(expected);
  });

  it('hashPassword produces a verifiable argon2id hash', async () => {
    const hash = await hashPassword('secret');

    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(argon2.verify(hash, 'secret')).resolves.toBe(true);
  });
});
