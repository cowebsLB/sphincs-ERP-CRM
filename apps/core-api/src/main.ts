import { Logger, RequestMethod, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PrismaService } from "./prisma.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (process.env.CORS_ORIGINS ??
    "https://cowebslb.github.io,http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  });

  app.setGlobalPrefix("api/v1", {
    exclude: [{ path: "health", method: RequestMethod.GET }]
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.get(PrismaService).enableShutdownHooks(app);

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
  Logger.log(`core-api listening on port ${port}`);
}

bootstrap();
