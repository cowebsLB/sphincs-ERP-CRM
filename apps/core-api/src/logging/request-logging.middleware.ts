import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

type RequestUser = { id?: string };
type RequestWithUser = Request & { user?: RequestUser };

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger("RequestLogger");

  use(req: Request, res: Response, next: NextFunction): void {
    const request = req as RequestWithUser;
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      const headerUserId = req.headers["x-user-id"];
      const headerUserIdValue = Array.isArray(headerUserId) ? headerUserId[0] : headerUserId;
      const userId = request.user?.id ?? headerUserIdValue ?? "anonymous";
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
