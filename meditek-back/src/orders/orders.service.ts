import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { EmailService } from '../email/email.service';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        private pdfService: PdfService,
        private emailService: EmailService,
    ) { }

    async createOrder(userId: number, orderData: any) {
        const { items, customerInfo, paymentMethod } = orderData;

        // Verificar stock
        for (const item of items) {
            const product = await this.prisma.product.findUnique({
                where: { id: item.productId }
            });

            if (!product) {
                throw new NotFoundException(`Producto ${item.productId} no encontrado`);
            }

            if (product.stock < item.quantity) {
                throw new BadRequestException(`Stock insuficiente para ${product.name}`);
            }
        }

        // Generar número de orden único
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Crear la orden
        const order = await this.prisma.order.create({
            data: {
                orderNumber,
                userId,
                customerName: customerInfo.name,
                customerEmail: customerInfo.email,
                customerPhone: customerInfo.phone,
                customerAddress: customerInfo.address,
                total: customerInfo.total,
                paymentMethod,
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        subtotal: item.price * item.quantity
                    }))
                }
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        // Actualizar stock
        for (const item of items) {
            await this.prisma.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        decrement: item.quantity
                    }
                }
            });
        }

        return order;
    }

    async findAll(userId?: number, role?: string) {
        if (role === 'ADMIN') {
            return this.prisma.order.findMany({
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    user: true
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        return this.prisma.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: number) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: true
            }
        });

        if (!order) {
            throw new NotFoundException(`Orden ${id} no encontrada`);
        }

        return order;
    }

    async updateStatus(id: number, status: OrderStatus) {
        return this.prisma.order.update({
            where: { id },
            data: { status }
        });
    }

    async updatePaymentStatus(id: number, paymentStatus: PaymentStatus, paymentId?: string) {
        return this.prisma.order.update({
            where: { id },
            data: {
                paymentStatus,
                paymentId
            }
        });
    }

    async processPayment(orderId: number, paymentData: any) {
        const order = await this.findOne(orderId);
        
        const paymentSuccessful = true;

        if (paymentSuccessful) {
            await this.updatePaymentStatus(orderId, PaymentStatus.PAID);
            await this.updateStatus(orderId, OrderStatus.CONFIRMED);

            // Generar PDF
            const pdfBuffer = await this.pdfService.generateInvoice(order);

            // Enviar email con comprobante
            await this.emailService.sendInvoiceEmail(order.customerEmail, order, pdfBuffer); 

            return { success: true, message: 'Pago procesado exitosamente' };
        }
    }

    async cancelOrder(id: number) {
        const order = await this.findOne(id);

        if (order.status === OrderStatus.DELIVERED) {
            throw new BadRequestException('No se puede cancelar una orden ya entregada');
        }

        // Revertir stock
        for (const item of order.items) {
            await this.prisma.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        increment: item.quantity
                    }
                }
            });
        }

        return this.prisma.order.update({
            where: { id },
            data: { status: OrderStatus.CANCELLED }
        });
    }
}