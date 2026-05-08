import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FirebaseModule } from './firebase/firebase.module';
import { ConfigModule } from '@nestjs/config';
import { SpecialtiesModule } from './specialties/specialties.module';
import { DoctorsModule } from './doctors/doctors.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [PrismaModule, AuthModule, FirebaseModule, ConfigModule.forRoot({
    isGlobal: true,
  }), AuthModule, SpecialtiesModule, DoctorsModule, ProductsModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
