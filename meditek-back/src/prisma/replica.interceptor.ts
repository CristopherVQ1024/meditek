import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaReplicaService } from './prisma-replica.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class ReplicaInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly replica: PrismaReplicaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    return next.handle().pipe(
      tap(async (data) => {
        // Solo replicar en POST (creaciones)
        if (method === 'POST' && data?.id) {
          const model = this.getModelFromUrl(req.url);
          if (model) {
            try {
              await (this.replica as any)[model].create({ data });
            } catch (e) {
              console.error('Error replicando:', e);
            }
          }
        }
      }),
    );
  }

  private getModelFromUrl(url: string): string | null {
    const map: Record<string, string> = {
      'patients': 'patient',
      'doctors': 'doctor',
      'consultations': 'consultation',
      'appointments': 'appointment',
      'orders': 'order',
      'prescriptions': 'prescription',
      'treatments': 'treatment',
      'referrals': 'referral',
      'products': 'product',
      'specialties': 'specialty',
    };

    const segment = url.split('/').filter(Boolean)[0];
    return map[segment] ?? null;
  }
}