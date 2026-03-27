import { Controller, Get } from "@nestjs/common";

@Controller("system")
export class SystemController {
  @Get("info")
  info() {
    return {
      version: process.env.APP_VERSION ?? "Beta V1.16.50",
      environment: process.env.NODE_ENV ?? "development",
      build_hash: process.env.BUILD_HASH ?? "dev",
      timestamp: new Date().toISOString()
    };
  }
}
