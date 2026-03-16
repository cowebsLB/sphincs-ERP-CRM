import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger("RequestLogger");

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      const userId = req.headers["x-user-id"] ?? "anonymous";
      this.logger.log(
        JSON.stringify({
          method: req.method,
          path: req.originalUrl,
          user_id: userId,
          duration_ms: duration,
          status_code: res.statusCode
        })
      );
    });
    next();
  }
}

