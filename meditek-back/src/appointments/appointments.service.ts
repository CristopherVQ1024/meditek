import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppointmentsService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        // Validar datos requeridos
        if (!data.userId || !data.doctorId || !data.date) {  // ← Cambiar a userId
            throw new BadRequestException('Faltan datos requeridos para la cita');
        }

        const userId = Number(data.userId);      // ← userId del usuario logueado
        const doctorId = Number(data.doctorId);

        if (isNaN(userId) || isNaN(doctorId)) {
            throw new BadRequestException('IDs deben ser números válidos');
        }

        const appointmentDate = new Date(data.date);
        const now = new Date();

        if (appointmentDate < now) {
            throw new BadRequestException('No se pueden crear citas en fechas pasadas');
        }

        // ✅ Buscar el paciente usando userId (NO patientId)
        const patient = await this.prisma.patient.findUnique({
            where: { userId: userId },  // ← Buscar por userId
            include: { user: true }
        });

        if (!patient) {
            throw new NotFoundException(`Paciente con userId ${userId} no encontrado`);
        }

        // Verificar si el doctor existe
        const doctor = await this.prisma.doctor.findUnique({
            where: { id: doctorId },
            include: {
                user: true,
                specialty: true
            }
        });

        if (!doctor) {
            throw new NotFoundException(`Doctor con ID ${doctorId} no encontrado`);
        }

        // Verificar si ya existe una cita para ese doctor en esa fecha y hora
        const existingAppointment = await this.prisma.consultation.findFirst({
            where: {
                doctorId: doctorId,
                date: appointmentDate,
                status: { not: 'cancelled' }
            }
        });

        if (existingAppointment) {
            throw new ConflictException('El doctor ya tiene una cita programada en ese horario');
        }

        // ✅ Crear la consulta usando patient.id (NO userId)
        const appointment = await this.prisma.consultation.create({
            data: {
                patientId: patient.id,  // ← Usar el patient.id real de la base de datos
                doctorId: doctorId,
                date: appointmentDate,
                symptoms: data.reason || null,
                diagnosis: 'Pendiente',
                observations: null,
                status: data.status || 'pending'
            },
            include: {
                patient: {
                    include: { user: true }
                },
                doctor: {
                    include: {
                        user: true,
                        specialty: true
                    }
                }
            }
        });

        // Formatear la respuesta
        return {
            id: appointment.id,
            patientId: appointment.patientId,
            patientName: appointment.patient.user.name,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctor.user.name,
            specialtyName: appointment.doctor.specialty.name,
            date: appointment.date.toISOString().split('T')[0],
            time: appointment.date.toTimeString().split(' ')[0].substring(0, 5),
            reason: appointment.symptoms,
            status: appointment.status,
            createdAt: appointment.createdAt
        };
    }

    async findAll() {
        const appointments = await this.prisma.consultation.findMany({
            include: {
                patient: {
                    include: { user: true }
                },
                doctor: {
                    include: {
                        user: true,
                        specialty: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        return appointments.map(appointment => ({
            id: appointment.id,
            patientId: appointment.patientId,
            patientName: appointment.patient.user.name,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctor.user.name,
            specialtyName: appointment.doctor.specialty.name,
            date: appointment.date.toISOString().split('T')[0],
            time: appointment.date.toTimeString().split(' ')[0].substring(0, 5),
            reason: appointment.symptoms,
            status: appointment.status,
            createdAt: appointment.createdAt
        }));
    }

    async findByPatient(userId: number) {  // ← Recibir userId
        // Buscar el paciente por userId
        const patient = await this.prisma.patient.findUnique({
            where: { userId: userId }  // ← Buscar por userId
        });

        if (!patient) {
            throw new NotFoundException(`Paciente con userId ${userId} no encontrado`);
        }

        // Buscar citas usando patient.id
        const appointments = await this.prisma.consultation.findMany({
            where: { patientId: patient.id },  // ← Usar patient.id
            include: {
                patient: {
                    include: { user: true }
                },
                doctor: {
                    include: {
                        user: true,
                        specialty: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        return appointments.map(appointment => ({
            id: appointment.id,
            patientId: appointment.patientId,
            patientName: appointment.patient.user.name,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctor.user.name,
            specialtyName: appointment.doctor.specialty.name,
            date: appointment.date.toISOString().split('T')[0],
            time: appointment.date.toTimeString().split(' ')[0].substring(0, 5),
            reason: appointment.symptoms,
            status: appointment.status,
            createdAt: appointment.createdAt
        }));
    }

    async findByDoctor(doctorId: number) {
        const id = Number(doctorId);
        const appointments = await this.prisma.consultation.findMany({
            where: { doctorId: id },
            include: {
                patient: {
                    include: { user: true }
                },
                doctor: {
                    include: {
                        user: true,
                        specialty: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        return appointments.map(appointment => ({
            id: appointment.id,
            patientId: appointment.patientId,
            patientName: appointment.patient.user.name,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctor.user.name,
            specialtyName: appointment.doctor.specialty.name,
            date: appointment.date.toISOString().split('T')[0],
            time: appointment.date.toTimeString().split(' ')[0].substring(0, 5),
            reason: appointment.symptoms,
            status: appointment.status,
            createdAt: appointment.createdAt
        }));
    }

    async findOne(id: number) {
        const appointment = await this.prisma.consultation.findUnique({
            where: { id },
            include: {
                patient: {
                    include: { user: true }
                },
                doctor: {
                    include: {
                        user: true,
                        specialty: true
                    }
                }
            }
        });

        if (!appointment) {
            throw new NotFoundException(`Cita con ID ${id} no encontrada`);
        }

        return {
            id: appointment.id,
            patientId: appointment.patientId,
            patientName: appointment.patient.user.name,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctor.user.name,
            specialtyName: appointment.doctor.specialty.name,
            date: appointment.date.toISOString().split('T')[0],
            time: appointment.date.toTimeString().split(' ')[0].substring(0, 5),
            reason: appointment.symptoms,
            status: appointment.status,
            createdAt: appointment.createdAt
        };
    }

    async update(id: number, data: any) {
        const appointmentId = Number(id);
        const existingAppointment = await this.prisma.consultation.findUnique({
            where: { id: appointmentId }
        });

        if (!existingAppointment) {
            throw new NotFoundException(`Cita con ID ${id} no encontrada`);
        }

        const updateData: any = {};

        if (data.date) {
            const newDate = new Date(data.date);
            if (newDate < new Date()) {
                throw new BadRequestException('No se puede reprogramar a una fecha pasada');
            }
            updateData.date = newDate;
        }

        if (data.symptoms !== undefined) updateData.symptoms = data.symptoms;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis;
        if (data.observations !== undefined) updateData.observations = data.observations;

        const updated = await this.prisma.consultation.update({
            where: { id },
            data: updateData,
            include: {
                patient: {
                    include: { user: true }
                },
                doctor: {
                    include: {
                        user: true,
                        specialty: true
                    }
                }
            }
        });

        return {
            id: updated.id,
            patientId: updated.patientId,
            patientName: updated.patient.user.name,
            doctorId: updated.doctorId,
            doctorName: updated.doctor.user.name,
            specialtyName: updated.doctor.specialty.name,
            date: updated.date.toISOString().split('T')[0],
            time: updated.date.toTimeString().split(' ')[0].substring(0, 5),
            reason: updated.symptoms,
            status: updated.status,
            createdAt: updated.createdAt
        };
    }

    async updateStatus(id: number, status: string) {
        const appointmentId = Number(id);
        const validStatuses = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new BadRequestException('Estado no válido');
        }

        const appointment = await this.prisma.consultation.update({
            where: { id: appointmentId },
            data: { status },
            include: {
                patient: {
                    include: { user: true }
                },
                doctor: {
                    include: {
                        user: true,
                        specialty: true
                    }
                }
            }
        });

        return {
            id: appointment.id,
            status: appointment.status
        };
    }

    async remove(id: number) {
        const appointment = await this.prisma.consultation.findUnique({
            where: { id }
        });

        if (!appointment) {
            throw new NotFoundException(`Cita con ID ${id} no encontrada`);
        }

        await this.prisma.consultation.delete({ where: { id } });

        return { message: 'Cita eliminada correctamente' };
    }
}