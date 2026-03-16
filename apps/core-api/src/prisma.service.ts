import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common";

@Injectable()
export class PrismaService implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    return Promise.resolve();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.on("beforeExit", async () => {
      await app.close();
    });
  }
}
