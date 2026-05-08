// src/doctors/doctors.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DoctorsService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        const specialtyId = Number(data.specialtyId);

        if (isNaN(specialtyId)) {
            throw new Error('specialtyId debe ser un número válido');
        }

        const specialty = await this.prisma.specialty.findUnique({
            where: { id: specialtyId }
        });

        if (!specialty) {
            throw new NotFoundException(`Especialidad con ID ${specialtyId} no encontrada`);
        }

        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            throw new ConflictException(`Ya existe un usuario con el email ${data.email}`);
        }

        if (data.dni) {
            const existingDni = await this.prisma.user.findUnique({
                where: { dni: data.dni }
            });

            if (existingDni) {
                throw new ConflictException(`Ya existe un usuario con el DNI ${data.dni}`);
            }
        }

        // Usar transacción para crear User y Doctor juntos
        const doctor = await this.prisma.$transaction(async (prisma) => {
            // 1. Crear el usuario
            const user = await prisma.user.create({
                data: {
                    firebaseUid: `doctor_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    email: data.email,
                    name: data.name,
                    dni: data.dni,
                    age: data.age ? Number(data.age) : 0,
                    phone: data.phone || null,
                    role: 'DOCTOR'
                }
            });

            // 2. Crear el doctor ligado al usuario
            const doctor = await prisma.doctor.create({
                data: {
                    userId: user.id,
                    specialtyId: specialtyId,
                    specialtyName: specialty.name
                },
                include: {
                    specialty: true,
                    user: true
                }
            });

            return doctor;
        });

        return doctor;
    }

    async findAll() {
        return this.prisma.doctor.findMany({
            include: {
                specialty: true,
                user: true
            },
            orderBy: { id: 'asc' }
        });
    }

    async findOne(id: number) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { id },
            include: {
                specialty: true,
                user: true
            }
        });

        if (!doctor) {
            throw new NotFoundException(`Doctor con ID ${id} no encontrado`);
        }

        return doctor;
    }

    async update(id: number, data: any) {
        const existingDoctor = await this.prisma.doctor.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!existingDoctor) {
            throw new NotFoundException(`Doctor con ID ${id} no encontrado`);
        }

        const userData: any = {};
        const doctorData: any = {};

        // Datos para User
        if (data.name !== undefined) userData.name = data.name;
        if (data.email !== undefined) {
            if (data.email !== existingDoctor.user.email) {
                const emailExists = await this.prisma.user.findUnique({
                    where: { email: data.email }
                });
                if (emailExists) {
                    throw new ConflictException(`El email ${data.email} ya está en uso`);
                }
                userData.email = data.email;
            }
        }
        if (data.phone !== undefined) userData.phone = data.phone;
        if (data.dni !== undefined) {
            if (data.dni !== existingDoctor.user.dni) {
                const dniExists = await this.prisma.user.findUnique({
                    where: { dni: data.dni }
                });
                if (dniExists) {
                    throw new ConflictException(`El DNI ${data.dni} ya está en uso`);
                }
                userData.dni = data.dni;
            }
        }
        if (data.age !== undefined) userData.age = Number(data.age);

        // Datos para Doctor
        if (data.specialtyId !== undefined) {
            const specialtyId = Number(data.specialtyId);
            if (isNaN(specialtyId)) {
                throw new Error('specialtyId debe ser un número válido');
            }

            const specialty = await this.prisma.specialty.findUnique({
                where: { id: specialtyId }
            });

            if (!specialty) {
                throw new NotFoundException(`Especialidad con ID ${specialtyId} no encontrada`);
            }

            doctorData.specialtyId = specialtyId;
            doctorData.specialtyName = specialty.name;
        }

        // Actualizar en transacción
        const result = await this.prisma.$transaction(async (prisma) => {
            if (Object.keys(userData).length > 0) {
                await prisma.user.update({
                    where: { id: existingDoctor.userId },
                    data: userData
                });
            }

            if (Object.keys(doctorData).length > 0) {
                await prisma.doctor.update({
                    where: { id },
                    data: doctorData
                });
            }

            return prisma.doctor.findUnique({
                where: { id },
                include: { specialty: true, user: true }
            });
        });

        return result;
    }

    async remove(id: number) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { id }
        });

        if (!doctor) {
            throw new NotFoundException(`Doctor con ID ${id} no encontrado`);
        }

        await this.prisma.$transaction(async (prisma) => {
            await prisma.doctor.delete({ where: { id } });
            await prisma.user.delete({ where: { id: doctor.userId } });
        });

        return { message: 'Doctor eliminado correctamente' };
    }

    async findByUserId(userId: number) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { userId },
            include: {
                specialty: true,
                user: true
            }
        });

        if (!doctor) {
            throw new NotFoundException(`Doctor con userId ${userId} no encontrado`);
        }

        return doctor;
    }

    async findByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                doctor: {
                    include: { specialty: true }
                }
            }
        });

        if (!user || user.role !== 'DOCTOR') {
            throw new NotFoundException(`Doctor con email ${email} no encontrado`);
        }

        return user.doctor;
    }
}