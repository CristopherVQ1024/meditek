import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  private primary = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  private secondary = new PrismaClient({ datasourceUrl: process.env.DATABASE_REPLICA_URL });

  private usingPrimary = true;
  private healthInterval!: NodeJS.Timeout;
  private lastFailoverAt: Date | null = null; // marca desde cuándo reconciliar

  constructor() {
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        const active = target.usingPrimary ? target.primary : target.secondary;
        return (active as any)[prop];
      },
    });
  }

  async onModuleInit() {
    await this.primary.$connect().catch(() => this.logger.error('No se pudo conectar a la primaria'));
    await this.secondary.$connect().catch(() => this.logger.error('No se pudo conectar a la secundaria'));
    this.healthInterval = setInterval(() => this.healthCheck(), 5000);
  }

  onModuleDestroy() {
    clearInterval(this.healthInterval);
  }

  private async healthCheck() {
    const primaryOk = await this.ping(this.primary);

    if (primaryOk && !this.usingPrimary) {
      this.logger.warn('🔄 Primaria recuperada. Reconciliando...');
      await this.reconcile();
      this.usingPrimary = true;
      this.lastFailoverAt = null;
      this.logger.warn('✅ Failback completo: usando primaria de nuevo.');
    }

    if (!primaryOk && this.usingPrimary) {
      this.logger.error('❌ Primaria caída. Failover automático a secundaria.');
      this.usingPrimary = false;
      this.lastFailoverAt = new Date(); // guardamos desde cuándo empezó la caída
    }
  }

  private async ping(client: PrismaClient): Promise<boolean> {
    try {
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async reconcile() {
    // Usamos el momento exacto en que cayó la primaria, no una ventana fija de 1 hora
    const since = this.lastFailoverAt ?? new Date(Date.now() - 1000 * 60 * 60);

    // 1. Users (no depende de nada)
    const users = await this.secondary.user.findMany({ where: { updatedAt: { gte: since } } });
    for (const u of users) {
      await this.primary.user.upsert({ where: { id: u.id }, update: u, create: u });
    }
    this.logger.log(`Reconciliados ${users.length} "user"`);

    // 2. Consultations (depende de Patient y Doctor, asumimos que ya existían antes de la caída)
    const consultations = await this.secondary.consultation.findMany({ where: { updatedAt: { gte: since } } });
    for (const c of consultations) {
      await this.primary.consultation.upsert({ where: { id: c.id }, update: c, create: c });
    }
    this.logger.log(`Reconciliadas ${consultations.length} "consultation"`);

    // 3. Orders (depende de User)
    const orders = await this.secondary.order.findMany({ where: { updatedAt: { gte: since } } });
    for (const o of orders) {
      await this.primary.order.upsert({ where: { id: o.id }, update: o, create: o });
    }
    this.logger.log(`Reconciliadas ${orders.length} "order"`);
  }
}