
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // make paths relative to this package
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:process.env.DATABASE_URL,
    // optional (recommended for some setups)
    // directUrl: env("DIRECT_DATABASE_URL"),
  },
});

