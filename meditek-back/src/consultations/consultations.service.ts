import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConsultationsService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        // Obtener el doctor actual (deberías pasar el userId desde el token)
        const doctor = await this.prisma.doctor.findFirst({
            where: { userId: data.doctorUserId }
        });

        if (!doctor) {
            throw new NotFoundException('Doctor no encontrado');
        }

        const patient = await this.prisma.patient.findUnique({
            where: { id: data.patientId },
            include: { user: true }
        });

        if (!patient) {
            throw new NotFoundException('Paciente no encontrado');
        }

        const consultation = await this.prisma.consultation.create({
            data: {
                patientId: data.patientId,
                doctorId: doctor.id,
                symptoms: data.symptoms,
                diagnosis: data.diagnosis,
                observations: data.observations,
                status: 'completed'
            },
            include: {
                patient: { include: { user: true } },
                doctor: { include: { user: true } }
            }
        });

        return consultation;
    }

    async findAll() {
        return this.prisma.consultation.findMany({
            include: {
                patient: { include: { user: true } },
                doctor: { include: { user: true } },
                treatment: true,
                prescription: true
            },
            orderBy: { date: 'desc' }
        });
    }

    async findByDoctor(doctorUserId: number) {
        const doctor = await this.prisma.doctor.findFirst({
            where: { userId: doctorUserId }
        });

        if (!doctor) {
            throw new NotFoundException('Doctor no encontrado');
        }

        return this.prisma.consultation.findMany({
            where: { doctorId: doctor.id },
            include: {
                patient: { include: { user: true } },
                treatment: true,
                prescription: true
            },
            orderBy: { date: 'desc' }
        });
    }

    async findByPatient(patientId: number) {
        return this.prisma.consultation.findMany({
            where: { patientId },
            include: {
                doctor: { include: { user: true } },
                treatment: true,
                prescription: true
            },
            orderBy: { date: 'desc' }
        });
    }

    async findOne(id: number) {
        const consultation = await this.prisma.consultation.findUnique({
            where: { id },
            include: {
                patient: { include: { user: true } },
                doctor: { include: { user: true } },
                treatment: true,
                prescription: true
            }
        });

        if (!consultation) {
            throw new NotFoundException(`Consulta con ID ${id} no encontrada`);
        }

        return consultation;
    }
}