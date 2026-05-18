import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MedicalHistoryService {
    constructor(private prisma: PrismaService) { }

    async findByPatient(patientId: number) {
        const history = await this.prisma.medicalHistory.findUnique({
            where: { patientId }
        });

        if (!history) {
            const patient = await this.prisma.patient.findUnique({
                where: { id: patientId }
            });

            if (!patient) {
                throw new NotFoundException(`Paciente con ID ${patientId} no encontrado`);
            }

            return this.prisma.medicalHistory.create({
                data: {
                    patientId,
                    chronicDiseases: [],
                    surgeries: [],
                    medications: [],
                    familyHistory: ''
                }
            });
        }

        return history;
    }

    async update(patientId: number, data: any) {
        const history = await this.prisma.medicalHistory.findUnique({
            where: { patientId }
        });

        if (!history) {
            throw new NotFoundException(`Historial médico no encontrado`);
        }

        return this.prisma.medicalHistory.update({
            where: { patientId },
            data: {
                chronicDiseases: data.chronicDiseases || [],
                surgeries: data.surgeries || [],
                familyHistory: data.familyHistory || '',
                medications: data.medications || []
            }
        });
    }
}