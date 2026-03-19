import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { PrismaModule } from "./prisma.module";
import { AuthModule } from "./core/auth/auth.module";
import { UsersModule } from "./core/users/users.module";
import { RolesModule } from "./core/roles/roles.module";
import { OrganizationsModule } from "./core/organizations/organizations.module";
import { BranchesModule } from "./core/branches/branches.module";
import { ItemsModule } from "./erp/items/items.module";
import { PurchasingModule } from "./erp/purchasing/purchasing.module";
import { SuppliersModule } from "./erp/suppliers/suppliers.module";
import { ContactsModule } from "./crm/contacts/contacts.module";
import { LeadsModule } from "./crm/leads/leads.module";
import { OpportunitiesModule } from "./crm/opportunities/opportunities.module";
import { AuditModule } from "./audit/audit.module";
import { HealthModule } from "./health/health.module";
import { SystemModule } from "./system/system.module";
import { LoggingModule } from "./logging/logging.module";
import { BugsModule } from "./bugs/bugs.module";
import { RequestLoggingMiddleware } from "./logging/request-logging.middleware";
import { RolesGuard } from "./common/guards/roles.guard";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    OrganizationsModule,
    BranchesModule,
    ItemsModule,
    PurchasingModule,
    SuppliersModule,
    ContactsModule,
    LeadsModule,
    OpportunitiesModule,
    AuditModule,
    HealthModule,
    SystemModule,
    LoggingModule,
    BugsModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes("*");
  }
}
