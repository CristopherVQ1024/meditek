// src/referrals/referrals.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferralsService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        const doctor = await this.prisma.doctor.findFirst({
            where: { userId: data.doctorUserId },
            include: { specialty: true }
        });

        if (!doctor) {
            throw new NotFoundException('Doctor no encontrado');
        }

        // Buscar la especialidad por nombre
        const toSpecialty = await this.prisma.specialty.findFirst({
            where: { name: data.toSpecialty }  // ← Usa findFirst, no findUnique
        });

        if (!toSpecialty) {
            throw new NotFoundException(`Especialidad "${data.toSpecialty}" no encontrada`);
        }

        return this.prisma.referral.create({
            data: {
                patientId: data.patientId,
                fromSpecialty: doctor.specialtyName,
                toSpecialtyId: toSpecialty.id,  // ← Usar el ID encontrado
                reason: data.reason,
                doctorId: doctor.id,
                status: 'pending'
            },
            include: {
                patient: { include: { user: true } },
                toSpecialty: true,
                doctor: { include: { user: true } }
            }
        });
    }

    async findByDoctor(doctorUserId: number) {
        const doctor = await this.prisma.doctor.findFirst({
            where: { userId: doctorUserId }
        });

        if (!doctor) {
            throw new NotFoundException('Doctor no encontrado');
        }

        return this.prisma.referral.findMany({
            where: { doctorId: doctor.id },
            include: {
                patient: { include: { user: true } },
                toSpecialty: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findAll() {
        return this.prisma.referral.findMany({
            include: {
                patient: { include: { user: true } },
                toSpecialty: true,
                doctor: { include: { user: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateStatus(id: number, status: string) {
        return this.prisma.referral.update({
            where: { id },
            data: { status }
        });
    }
}