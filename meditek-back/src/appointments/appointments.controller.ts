import { Controller, Get, Post, Body, Put, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    @Post()
    create(@Body() body: any) {
        return this.appointmentsService.create(body);
    }

    @Get()
    findAll() {
        return this.appointmentsService.findAll();
    }

    @Get('patient/:patientId')
    findByPatient(@Param('patientId') patientId: string) {
        return this.appointmentsService.findByPatient(+patientId);
    }

    @Get('doctor/:doctorId')
    findByDoctor(@Param('doctorId') doctorId: string) {
        return this.appointmentsService.findByDoctor(+doctorId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.appointmentsService.findOne(+id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.appointmentsService.update(+id, body);
    }

    @Put(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.appointmentsService.updateStatus(+id, status);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.appointmentsService.remove(+id);
    }
}