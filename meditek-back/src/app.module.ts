import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FirebaseModule } from './firebase/firebase.module';
import { ConfigModule } from '@nestjs/config';
import { SpecialtiesModule } from './specialties/specialties.module';
import { DoctorsModule } from './doctors/doctors.module';
import { ProductsModule } from './products/products.module';
import { PatientsModule } from './patients/patients.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { TreatmentsModule } from './treatments/treatments.module';
import { ReferralsModule } from './referrals/referrals.module';
import { MedicalHistoryModule } from './medical-history/medical-history.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { OrdersModule } from './orders/orders.module';
import { PdfModule } from './pdf/pdf.module';
import { EmailModule } from './email/email.module';
import { MetricsController } from './metrics/metrics.controller';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport: process.env.NODE_ENV === 'production'
          ? { target: '@logtail/pino', options: { sourceToken: process.env.BETTERSTACK_TOKEN } }
          : { target: 'pino-pretty' },
        autoLogging: true,
      },
    }),
    TerminusModule,
    PrismaModule, AuthModule, FirebaseModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule, SpecialtiesModule, DoctorsModule, ProductsModule, PatientsModule,
    ConsultationsModule, TreatmentsModule, ReferralsModule, MedicalHistoryModule,
    PrescriptionsModule, AppointmentsModule, OrdersModule, PdfModule, EmailModule,
  ],
  controllers: [AppController, MetricsController, HealthController],
  providers: [AppService],
})
export class AppModule {}