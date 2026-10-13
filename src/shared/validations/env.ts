import { z } from "zod";

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  
  // Database Configuration (PostgreSQL)
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid PostgreSQL connection string")
    .default("postgresql://leziva_user:leziva_pass@localhost:5432/leziva_db?schema=public"),
  DIRECT_URL: z.string().url().optional(),
  
  // Cache & Resilient Queues (Optional - defaults to high-performance In-Memory cache)
  REDIS_URL: z.string().optional(),
  
  // App & API URLs
  APP_URL: z.string().url().default("http://localhost:3000"),
  API_URL: z.string().url().default("http://localhost:3000/api/v1"),
  
  // Authentication & Session Security
  AUTH_SECRET: z.string().min(16).default("dev-secret-super-safe-key-change-in-production"),
  SESSION_SECRET: z.string().min(16).default("dev-secret-super-safe-key-change-in-production"),
  SESSION_COOKIE_NAME: z.string().default("leziva_session"),
  SESSION_TTL_SECONDS: z.coerce.number().default(604800), // 7 days
  
  // Email Provider
  EMAIL_PROVIDER: z.enum(["smtp", "resend", "ses", "mock"]).default("smtp"),
  SMTP_HOST: z.string().default("smtp.mailtrap.io"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default("smtp_placeholder_user"),
  SMTP_PASS: z.string().default("smtp_placeholder_pass"),
  EMAIL_FROM: z.string().default("LEZIVA Concierge <concierge@leziva.com>"),
  
  // Payment Gateway (Razorpay)
  RAZORPAY_KEY_ID: z.string().default("rzp_test_placeholder_key_id"),
  RAZORPAY_KEY_SECRET: z.string().default("rzp_test_placeholder_secret"),
  RAZORPAY_WEBHOOK_SECRET: z.string().default("rzp_webhook_secret_placeholder"),
  
  // Logistics (Velocity Shipping API - Production base: https://shazam.velocity.in/)
  VELOCITY_BASE_URL: z.string().url().default("https://shazam.velocity.in/"),
  VELOCITY_USERNAME: z.string().default("leziva_sandbox_user"),
  VELOCITY_PASSWORD: z.string().default("leziva_sandbox_password"),
  VELOCITY_WAREHOUSE_ID: z.string().default("WH_SURAT_001"),
  VELOCITY_PICKUP_LOCATION: z.string().default("LEZIVA Surat Atelier Warehouse"),
  VELOCITY_WAREHOUSE_PINCODE: z.string().default("395007"),
  VELOCITY_REQUEST_TIMEOUT_MS: z.coerce.number().default(15000),
  VELOCITY_API_KEY: z.string().default("velocity_placeholder_api_key"),
  VELOCITY_API_URL: z.string().url().default("https://shazam.velocity.in/"),
  
  // Media Storage
  S3_BUCKET_NAME: z.string().default("leziva-media-dev"),
  S3_REGION: z.string().default("ap-south-1"),
  S3_ACCESS_KEY_ID: z.string().default("s3_placeholder_access_key"),
  S3_SECRET_ACCESS_KEY: z.string().default("s3_placeholder_secret_key"),

  // Supabase Platform Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_JWKS_URL: z.string().url().optional(),
});

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_BRAND_NAME: z.string().default("LEZIVA"),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional().default("rzp_test_placeholder_key_id"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

let validatedServerEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (validatedServerEnv) {
    return validatedServerEnv;
  }

  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = JSON.stringify(result.error.format(), null, 2);
    console.error("❌ Fatal: Invalid Server Environment Configuration:\n", errorDetails);
    throw new Error(`Invalid Server Environment Configuration: ${errorDetails}`);
  }

  validatedServerEnv = result.data;
  return validatedServerEnv;
}

export function validateEnv() {
  const server = getServerEnv();
  const clientResult = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME,
  });

  if (!clientResult.success) {
    console.error("❌ Fatal: Invalid Client Environment Configuration:", clientResult.error.format());
    throw new Error("Invalid Client Environment Configuration");
  }

  return {
    server,
    client: clientResult.data,
  };
}

export const env = {
  ...clientEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME,
  }),
};
