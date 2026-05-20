import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {

  private replica: PrismaClient;

  constructor() {
    super();
    this.replica = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_REPLICA_URL }
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
    await this.replica.$connect();
  }

  async replicateCreate(model: string, args: any) {
    try {
      await (this.replica as any)[model].create(args);
    } catch (e) {
      console.error('Error replicando:', e);
    }
  }
}