import { Module } from "@nestjs/common";
import { LeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";
import { AuditModule } from "../../audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [LeadsController],
  providers: [LeadsService]
})
export class LeadsModule {}
