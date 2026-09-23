import { describe, expect, it } from 'vitest';
import { buildPagination, getSkip, paginationQuerySchema } from './pagination.js';
describe('pagination', () => {
    it('computes skip and meta', () => {
        expect(getSkip(1, 20)).toBe(0);
        expect(getSkip(3, 10)).toBe(20);
        expect(buildPagination(1, 20, 0)).toEqual({
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
        });
        expect(buildPagination(2, 10, 25).totalPages).toBe(3);
    });
    it('rejects limits above 100 and defaults page', () => {
        expect(paginationQuerySchema.parse({}).page).toBe(1);
        expect(paginationQuerySchema.parse({ limit: '100' }).limit).toBe(100);
        expect(() => paginationQuerySchema.parse({ limit: '500' })).toThrow();
    });
});
