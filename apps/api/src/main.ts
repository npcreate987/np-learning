import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PrismaExceptionFilter } from "./prisma-exception.filter";

// Load apps/api/.env into process.env before the app (and JWT strategy) boot.
try {
  process.loadEnvFile();
} catch {
  // No .env file present; rely on the ambient environment.
}

// eslint-disable-next-line no-console
console.log("[main] node starting", {
  cwd: process.cwd(),
  PORT: process.env.PORT,
  API_PORT: process.env.API_PORT,
  hasDbUrl: !!process.env.DATABASE_URL,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  const origin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
  app.enableCors({
    origin: origin.split(",").map((o) => o.trim()),
    credentials: true,
  });

  // Railway injects PORT (dynamic); fall back to API_PORT for local dev, then 4000.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  // eslint-disable-next-line no-console
  console.log(`[main] listening on port ${port}`);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[main] bootstrap failed", err);
  process.exit(1);
});
