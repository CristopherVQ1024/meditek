import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.product.create({
            data
        });
    }

    async findAll() {
        return this.prisma.product.findMany({
            orderBy: { id: 'asc' }
        });
    }

    async findOne(id: number) {
        return this.prisma.product.findUnique({
            where: { id }
        });
    }

    async update(id: number, data: any) {
        return this.prisma.product.update({
            where: { id },
            data
        });
    }

    async remove(id: number) {
        return this.prisma.product.delete({
            where: { id }
        });
    }
}