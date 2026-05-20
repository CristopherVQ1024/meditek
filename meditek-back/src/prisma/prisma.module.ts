import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaReplicaService } from './prisma-replica.service';

@Global()
@Module({
  providers: [PrismaService, PrismaReplicaService],
  exports: [PrismaService, PrismaReplicaService],
})
export class PrismaModule {}