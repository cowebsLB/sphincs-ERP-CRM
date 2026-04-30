import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  private async connectWithRetry(): Promise<void> {
    const isProduction = process.env.NODE_ENV === "production";
    const defaultMaxRetries = isProduction ? 3 : 5;
    const defaultBaseDelayMs = isProduction ? 1000 : 750;
    const maxRetries = this.parsePositiveInt(process.env.PRISMA_CONNECT_MAX_RETRIES, defaultMaxRetries);
    const baseDelayMs = this.parsePositiveInt(process.env.PRISMA_CONNECT_RETRY_DELAY_MS, defaultBaseDelayMs);

    this.logger.log(
      `Prisma connect policy: maxRetries=${maxRetries}, baseDelayMs=${baseDelayMs}, env=${process.env.NODE_ENV ?? "unknown"}`
    );

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        await this.$connect();
        if (attempt > 1) {
          this.logger.log(`Prisma connected on retry attempt ${attempt}/${maxRetries}`);
        }
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (attempt >= maxRetries) {
          this.logger.error(`Prisma connect failed after ${maxRetries} attempts: ${message}`);
          throw error;
        }
        const delayMs = Math.min(baseDelayMs * 2 ** (attempt - 1), 15000);
        this.logger.warn(
          `Prisma connect attempt ${attempt}/${maxRetries} failed (${message}). Retrying in ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  private parsePositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return fallback;
    }
    return Math.floor(parsed);
  }
}
