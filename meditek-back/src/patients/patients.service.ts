import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientsService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            throw new Error(`Ya existe un usuario con el email ${data.email}`);
        }

        const result = await this.prisma.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    firebaseUid: `patient_${Date.now()}`,
                    email: data.email,
                    name: data.name,
                    dni: data.dni,
                    age: data.age,
                    phone: data.phone,
                    role: 'PATIENT'
                }
            });

            const patient = await prisma.patient.create({
                data: {
                    userId: user.id,
                    address: data.address,
                    bloodType: data.bloodType,
                    allergies: data.allergies || []
                },
                include: { user: true }
            });

            // Crear historial médico vacío
            await prisma.medicalHistory.create({
                data: {
                    patientId: patient.id,
                    chronicDiseases: [],
                    surgeries: [],
                    medications: []
                }
            });

            return patient;
        });

        return result;
    }

    async findAll() {
        return this.prisma.patient.findMany({
            include: {
                user: true,
                medicalHistory: true
            },
            orderBy: { id: 'asc' }
        });
    }

    async findOne(id: number) {
        const patient = await this.prisma.patient.findUnique({
            where: { id },
            include: {
                user: true,
                medicalHistory: true,
                consultations: {
                    include: { doctor: { include: { user: true } } }
                },
                treatments: true
            }
        });

        if (!patient) {
            throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
        }

        return patient;
    }

    async update(id: number, data: any) {
        const patient = await this.prisma.patient.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!patient) {
            throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
        }

        const userData: any = {};
        const patientData: any = {};

        if (data.name !== undefined) userData.name = data.name;
        if (data.email !== undefined) userData.email = data.email;
        if (data.phone !== undefined) userData.phone = data.phone;
        if (data.dni !== undefined) userData.dni = data.dni;
        if (data.age !== undefined) userData.age = data.age;
        if (data.address !== undefined) patientData.address = data.address;
        if (data.bloodType !== undefined) patientData.bloodType = data.bloodType;
        if (data.allergies !== undefined) patientData.allergies = data.allergies;

        await this.prisma.$transaction(async (prisma) => {
            if (Object.keys(userData).length > 0) {
                await prisma.user.update({
                    where: { id: patient.userId },
                    data: userData
                });
            }

            if (Object.keys(patientData).length > 0) {
                await prisma.patient.update({
                    where: { id },
                    data: patientData
                });
            }
        });

        return this.findOne(id);
    }

    async remove(id: number) {
        const patient = await this.prisma.patient.findUnique({
            where: { id }
        });

        if (!patient) {
            throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
        }

        await this.prisma.$transaction(async (prisma) => {
            await prisma.medicalHistory.delete({ where: { patientId: id } }).catch(() => null);
            await prisma.consultation.deleteMany({ where: { patientId: id } });
            await prisma.treatment.deleteMany({ where: { patientId: id } });
            await prisma.patient.delete({ where: { id } });
            await prisma.user.delete({ where: { id: patient.userId } });
        });

        return { message: 'Paciente eliminado correctamente' };
    }

    async getMedicalHistory(patientId: number) {
        const history = await this.prisma.medicalHistory.findUnique({
            where: { patientId }
        });

        if (!history) {
            throw new NotFoundException(`Historial médico no encontrado`);
        }

        return history;
    }

    async updateMedicalHistory(patientId: number, data: any) {
        return this.prisma.medicalHistory.update({
            where: { patientId },
            data
        });
    }
}