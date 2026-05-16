import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    create(@Body() body: any, @Req() req: any) {
        const userId = req.user?.id || 1; 
        return this.ordersService.createOrder(userId, body);
    }

    @Get()
    findAll(@Req() req: any) {
        const userId = req.user?.id;
        const role = req.user?.role;
        return this.ordersService.findAll(userId, role);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(+id);
    }

    @Put(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
        return this.ordersService.updateStatus(+id, status);
    }

    @Post(':id/pay')
    processPayment(@Param('id') id: string, @Body() paymentData: any) {
        return this.ordersService.processPayment(+id, paymentData);
    }

    @Put(':id/cancel')
    cancelOrder(@Param('id') id: string) {
        return this.ordersService.cancelOrder(+id);
    }
}