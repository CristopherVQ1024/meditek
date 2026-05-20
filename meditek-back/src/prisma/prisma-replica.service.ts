import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaReplicaService extends PrismaClient implements OnModuleInit {

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_REPLICA_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}