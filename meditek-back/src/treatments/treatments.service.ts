import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TreatmentsService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        const doctor = await this.prisma.doctor.findFirst({
            where: { userId: data.doctorUserId }
        });

        if (!doctor) {
            throw new NotFoundException('Doctor no encontrado');
        }

        return this.prisma.treatment.create({
            data: {
                consultationId: data.consultationId || null,
                patientId: data.patientId,
                doctorId: doctor.id,
                description: data.description,
                duration: data.duration,
                durationUnit: data.durationUnit,
                medications: data.medications || [],
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                status: data.status || 'active'
            },
            include: {
                patient: { include: { user: true } },
                doctor: { include: { user: true } }
            }
        });
    }

    async findAll() {
        return this.prisma.treatment.findMany({
            include: {
                patient: { include: { user: true } },
                doctor: { include: { user: true } },
                evolutions: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByPatient(patientId: number) {
        return this.prisma.treatment.findMany({
            where: { patientId },
            include: {
                doctor: { include: { user: true } },
                evolutions: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateStatus(id: number, status: string) {
        return this.prisma.treatment.update({
            where: { id },
            data: { status }
        });
    }

    async addEvolution(treatmentId: number, data: any) {
        const treatment = await this.prisma.treatment.findUnique({
            where: { id: treatmentId }
        });

        if (!treatment) {
            throw new NotFoundException('Tratamiento no encontrado');
        }

        return this.prisma.evolution.create({
            data: {
                treatmentId,
                notes: data.notes,
                doctorName: data.doctorName
            }
        });
    }

    async findByDoctor(doctorId: number) {
        return this.prisma.treatment.findMany({
            where: { doctorId },
            include: {
                patient: { include: { user: true } },
                doctor: { include: { user: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: number) {
        const treatment = await this.prisma.treatment.findUnique({
            where: { id },
            include: {
                patient: { include: { user: true } },
                doctor: { include: { user: true } },
                evolutions: true
            }
        });

        if (!treatment) {
            throw new NotFoundException(`Tratamiento con ID ${id} no encontrado`);
        }

        return treatment;
    }
}