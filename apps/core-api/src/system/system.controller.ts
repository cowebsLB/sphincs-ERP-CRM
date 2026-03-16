import { Controller, Get } from "@nestjs/common";

@Controller("system")
export class SystemController {
  @Get("info")
  info() {
    return {
      version: process.env.APP_VERSION ?? "0.1.0",
      environment: process.env.NODE_ENV ?? "development",
      build_hash: process.env.BUILD_HASH ?? "dev",
      timestamp: new Date().toISOString()
    };
  }
}
