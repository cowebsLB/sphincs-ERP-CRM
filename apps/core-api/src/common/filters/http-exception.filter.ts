import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const rawError = isHttpException ? exception.getResponse() : "Internal server error";
    const message =
      typeof rawError === "string"
        ? rawError
        : (rawError as { message?: string | string[] }).message ?? "Request failed";

    response.status(status).json({
      success: false,
      error: {
        code: `HTTP_${status}`,
        message
      },
      meta: {
        path: request.url,
        timestamp: new Date().toISOString()
      }
    });
  }
}
