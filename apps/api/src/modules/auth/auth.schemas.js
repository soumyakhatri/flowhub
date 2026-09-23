import { z } from 'zod';
const emailSchema = z.string().trim().email().max(320).transform((value) => value.toLowerCase());
export const registerSchema = z.object({
    name: z.string().trim().min(1).max(100),
    email: emailSchema,
    password: z.string().min(8).max(128),
});
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1).max(128),
});
export const refreshBodySchema = z
    .object({
    refreshToken: z.string().min(1).optional(),
})
    .partial()
    .optional();
