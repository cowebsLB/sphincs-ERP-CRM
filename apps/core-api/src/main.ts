import { Logger, RequestMethod, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  try {
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
    app.enableShutdownHooks();

    const port = Number(process.env.PORT || 3000);
    const host = process.env.HOST || "0.0.0.0";
    await app.listen(port, host);
    Logger.log(`core-api listening on ${host}:${port}`);
  } catch (error) {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    Logger.error(`core-api bootstrap failed: ${message}`);
    process.exit(1);
  }
}

bootstrap();
