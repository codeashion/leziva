import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://leziva_user:leziva_pass@localhost:5432/leziva_db?schema=public",
  },
});
