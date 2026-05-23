import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async googleLogin(idToken: string) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const { uid, email } = decodedToken;

            let user = await this.prisma.user.findUnique({
                where: { email },
                include: {
                    doctor: { include: { specialty: true } },
                    patient: true,
                },
            });

            if (!user) {
                throw new UnauthorizedException(
                    'Usuario no registrado. Contacta con un administrador.',
                );
            }

            if (!user.firebaseUid) {
                user = await this.prisma.user.update({
                    where: { email },
                    data: { firebaseUid: uid },
                    include: {
                        doctor: { include: { specialty: true } },
                        patient: true,
                    },
                });
            }

            const payload = {
                sub: user.id,
                email: user.email,
                role: user.role,
            };
            const token = this.jwtService.sign(payload);

            const redirectMap: Record<string, string> = {
                ADMIN: '/dashboard',
                DOCTOR: '/dashboard-medico',
                PATIENT: '/dashboard-paciente',
            };

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
                    patientId: user.patient?.id,
                },
                redirectTo: redirectMap[user.role] ?? '/',
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) throw error;
            throw new UnauthorizedException('Error al autenticar con Google');
        }
    }
}