import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Neon CLI writes branch credentials to .env.local; migrations use directUrl (DATABASE_URL_UNPOOLED) from the schema.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
