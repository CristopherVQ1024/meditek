import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SpecialtiesService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.specialty.create({
            data,
            include: { doctors: true }
        });
    }

    async findAll() {
        return this.prisma.specialty.findMany({
            include: { doctors: true },
            orderBy: { id: 'asc' }
        });
    }

    async findOne(id: number) {
        return this.prisma.specialty.findUnique({
            where: { id },
            include: { doctors: true }
        });
    }

    async update(id: number, data: any) {
        return this.prisma.specialty.update({
            where: { id },
            data,
            include: { doctors: true }
        });
    }

    async remove(id: number) {
        return this.prisma.specialty.delete({
            where: { id }
        });
    }
}