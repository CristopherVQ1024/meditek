// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {

    constructor(private prisma: PrismaService) { }

    async googleLogin(idToken: string) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const { uid, email, name } = decodedToken;

            // Buscar usuario por email (ya debe haber sido creado por admin/doctor)
            let user = await this.prisma.user.findUnique({
                where: { email },
                include: {
                    doctor: {
                        include: { specialty: true }
                    },
                    patient: true
                }
            });

            // Si no existe por email, rechazar acceso
            if (!user) {
                throw new UnauthorizedException(
                    'Usuario no registrado. Contacta con un administrador o doctor para que te registre.'
                );
            }

            // Si existe pero no tiene firebaseUid, actualizarlo
            if (!user.firebaseUid) {
                user = await this.prisma.user.update({
                    where: { email },
                    data: { firebaseUid: uid },
                    include: {
                        doctor: {
                            include: { specialty: true }
                        },
                        patient: true
                    }
                });
            }

            // Generar token JWT (puedes mejorar esto después)
            const token = this.generateJwt(user);

            // Determinar redirección según rol
            let redirectTo = '/';
            switch (user.role) {
                case 'ADMIN':
                    redirectTo = '/dashboard';
                    break;
                case 'DOCTOR':
                    redirectTo = '/dashboard-medico';
                    break;
                case 'PATIENT':
                    redirectTo = '/dashboard-paciente';
                    break;
            }

            return {
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    dni: user.dni,
                    doctorId: user.doctor?.id,
                    patientId: user.patient?.id
                },
                redirectTo
            };
        } catch (error) {
            console.error('Error en googleLogin:', error);
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Error al autenticar con Google');
        }
    }

    private generateJwt(user: any): string {
        // Token temporal (mejóralo con @nestjs/jwt después)
        return Buffer.from(JSON.stringify({
            userId: user.id,
            email: user.email,
            role: user.role
        })).toString('base64');
    }
}