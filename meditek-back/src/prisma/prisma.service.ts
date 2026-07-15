import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface PrismaService extends PrismaClient {}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  private primary = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  private secondary = new PrismaClient({ datasourceUrl: process.env.DATABASE_REPLICA_URL });

  private usingPrimary = true;
  private healthInterval!: NodeJS.Timeout;
  private lastFailoverAt: Date | null = null;

  constructor() {
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        const active = target.usingPrimary ? target.primary : target.secondary;
        return (active as any)[prop];
      },
    }) as PrismaService;
  }

  async onModuleInit() {
    try {
      await this.primary.$connect();
      this.logger.log('✅ Conectado a la DB PRIMARIA');
    } catch {
      this.logger.error('❌ No se pudo conectar a la primaria');
    }

    try {
      await this.secondary.$connect();
      this.logger.log('✅ Conectado a la DB SECUNDARIA');
    } catch {
      this.logger.error('❌ No se pudo conectar a la secundaria');
    }

    const primaryOk = await this.ping(this.primary);
    if (primaryOk) {
      this.logger.warn('🔄 Verificando si hay datos pendientes de reconciliar...');
      await this.reconcile();
      this.usingPrimary = true;
      this.lastFailoverAt = null;
      this.logger.warn('✅ Reconciliación de arranque completada.');
    } else {
      this.usingPrimary = false;
      this.lastFailoverAt = new Date();
      this.logger.error('❌ Primaria no disponible al iniciar. Usando secundaria.');
    }

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
      this.lastFailoverAt = new Date();
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
    const since = this.lastFailoverAt ?? new Date(Date.now() - 1000 * 60 * 60);

    const users = await this.secondary.user.findMany({ where: { updatedAt: { gte: since } } });
    for (const u of users) {
      await this.primary.user.upsert({ where: { id: u.id }, update: u, create: u });
    }
    this.logger.log(`Reconciliados ${users.length} "user"`);

    const consultations = await this.secondary.consultation.findMany({ where: { updatedAt: { gte: since } } });
    for (const c of consultations) {
      await this.primary.consultation.upsert({ where: { id: c.id }, update: c, create: c });
    }
    this.logger.log(`Reconciliadas ${consultations.length} "consultation"`);

    const orders = await this.secondary.order.findMany({ where: { updatedAt: { gte: since } } });
    for (const o of orders) {
      await this.primary.order.upsert({ where: { id: o.id }, update: o, create: o });
    }
    this.logger.log(`Reconciliadas ${orders.length} "order"`);
  }
}