import { Module } from '@nestjs/common';
import { SpecialtiesService } from './specialties.service';
import { SpecialtiesController } from './specialties.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SpecialtiesController],
  providers: [SpecialtiesService],
})
export class SpecialtiesModule { }