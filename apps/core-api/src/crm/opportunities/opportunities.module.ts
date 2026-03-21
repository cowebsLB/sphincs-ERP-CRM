import { Module } from "@nestjs/common";
import { OpportunitiesController } from "./opportunities.controller";
import { OpportunitiesService } from "./opportunities.service";
import { PurchasingModule } from "../../erp/purchasing/purchasing.module";

@Module({
  imports: [PurchasingModule],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService]
})
export class OpportunitiesModule {}
