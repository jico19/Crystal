import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from apps/api directory or fallback to process root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .default('postgres://postgres:postgres@localhost:5432/crystal_db'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters')
    .default('super-secret-jwt-key-change-in-production-12345'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  AWS_S3_BUCKET: z.string().default('crystal-prod-documents-secure'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  EMAIL_DRIVER: z.enum(['local', 'ses']).default('local'),
  SES_FROM_EMAIL: z.string().email().default('notifications@crystalhomecare.com'),
  SMS_DRIVER: z.enum(['local', 'twilio']).default('local'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().default('+15550199000'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables configuration:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;
