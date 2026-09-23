import { describe, expect, it } from 'vitest';
import { BCRYPT_COST, hashPassword, verifyPassword } from './password.js';
describe('password hashing', () => {
    it('uses bcrypt cost 12 and verifies matches', async () => {
        expect(BCRYPT_COST).toBe(12);
        const hash = await hashPassword('correct-horse');
        expect(hash).not.toBe('correct-horse');
        expect(hash.startsWith('$2')).toBe(true);
        expect(hash.includes('$12$')).toBe(true);
        expect(await verifyPassword('correct-horse', hash)).toBe(true);
        expect(await verifyPassword('wrong-password', hash)).toBe(false);
    });
});
