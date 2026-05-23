// src/prescriptions/prescriptions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class PrescriptionsService {
    constructor(private prisma: PrismaService, private emailService: EmailService) { }

    async create(data: any) {
        // Verificar que la consulta existe
        const consultation = await this.prisma.consultation.findUnique({
            where: { id: data.consultationId },
            include: {
                doctor: {
                    include: { user: true }
                }
            }
        });

        if (!consultation) {
            throw new NotFoundException(`Consulta con ID ${data.consultationId} no encontrada`);
        }

        // Verificar que el paciente existe
        const patient = await this.prisma.patient.findUnique({
            where: { id: data.patientId },
            include: { user: true }
        });

        if (!patient) {
            throw new NotFoundException(`Paciente con ID ${data.patientId} no encontrado`);
        }

        // Crear la receta
        const prescription = await this.prisma.prescription.create({
            data: {
                consultationId: data.consultationId,
                patientId: data.patientId,
                medications: data.medications,
                instructions: data.instructions || 'Tomar según indicación médica',
                hospitalSeal: '🏥 HOSPITAL MEDITEK - SELLO OFICIAL 🏥'
            },
            include: {
                consultation: {
                    include: {
                        doctor: { include: { user: true } }
                    }
                },
                patient: { include: { user: true } }
            }
        });

        // Enviar correo al paciente
        try {
            await this.emailService.sendPrescriptionEmail(
                patient.user.email,
                {
                    patientName: patient.user.name,
                    medications: data.medications,
                    instructions: data.instructions || 'Tomar según indicación médica'
                },
                consultation.doctor.user.name
            );
            console.log('✅ Receta enviada por correo a:', patient.user.email);
        } catch (error) {
            console.error('❌ Error al enviar correo:', error);
        }

        return prescription;
    }
    async findAll() {
        return this.prisma.prescription.findMany({
            include: {
                consultation: {
                    include: {
                        doctor: { include: { user: true } }
                    }
                },
                patient: { include: { user: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: number) {
        const prescription = await this.prisma.prescription.findUnique({
            where: { id },
            include: {
                consultation: {
                    include: {
                        doctor: { include: { user: true } }
                    }
                },
                patient: { include: { user: true } }
            }
        });

        if (!prescription) {
            throw new NotFoundException(`Receta con ID ${id} no encontrada`);
        }

        return prescription;
    }

    async findByPatient(patientId: number) {
        return this.prisma.prescription.findMany({
            where: { patientId },
            include: {
                consultation: {
                    include: {
                        doctor: { include: { user: true } }
                    }
                },
                patient: { include: { user: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByConsultation(consultationId: number) {
        return this.prisma.prescription.findUnique({
            where: { consultationId },
            include: {
                consultation: {
                    include: {
                        doctor: { include: { user: true } }
                    }
                },
                patient: { include: { user: true } }
            }
        });
    }

    async update(id: number, data: any) {
        const prescription = await this.prisma.prescription.findUnique({
            where: { id }
        });

        if (!prescription) {
            throw new NotFoundException(`Receta con ID ${id} no encontrada`);
        }

        return this.prisma.prescription.update({
            where: { id },
            data: {
                medications: data.medications,
                instructions: data.instructions
            },
            include: {
                consultation: {
                    include: {
                        doctor: { include: { user: true } }
                    }
                },
                patient: { include: { user: true } }
            }
        });
    }

    async remove(id: number) {
        const prescription = await this.prisma.prescription.findUnique({
            where: { id }
        });

        if (!prescription) {
            throw new NotFoundException(`Receta con ID ${id} no encontrada`);
        }

        return this.prisma.prescription.delete({
            where: { id }
        });
    }
}