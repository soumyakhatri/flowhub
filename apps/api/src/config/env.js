import { z } from 'zod';
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    MONGODB_URI: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(16),
    JWT_REFRESH_SECRET: z.string().min(16),
    JWT_ACCESS_EXPIRES: z.string().min(1).default('15m'),
    JWT_REFRESH_EXPIRES: z.string().min(1).default('7d'),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
    LOG_LEVEL: z
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
        .default('info'),
});
function loadEnv() {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        const message = parsed.error.issues
            .map((issue) => issue.path.join('.') + ': ' + issue.message)
            .join('; ');
        throw new Error('Invalid environment: ' + message);
    }
    return parsed.data;
}
export const env = loadEnv();
