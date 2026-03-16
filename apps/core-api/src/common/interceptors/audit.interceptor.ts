import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { AuditService } from "../../audit/audit.service";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, path, user } = request;

    return next.handle().pipe(
      tap(() => {
        const mutatingMethods = ["POST", "PATCH", "PUT", "DELETE"];
        if (mutatingMethods.includes(method)) {
          void this.auditService.record({
            action: `${method}_${path}`,
            entityType: "http",
            entityId: null,
            userId: user?.id ?? null,
            organizationId: user?.organizationId ?? null,
            metadata: { method, path }
          });
        }
      })
    );
  }
}
