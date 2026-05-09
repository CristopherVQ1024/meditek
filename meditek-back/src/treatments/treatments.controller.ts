import { Controller, Get, Post, Body, Put, Param } from '@nestjs/common';
import { TreatmentsService } from './treatments.service';

@Controller('treatments')
export class TreatmentsController {
    constructor(private readonly treatmentsService: TreatmentsService) { }

    @Post()
    create(@Body() body: any) {
        return this.treatmentsService.create(body);
    }

    @Get()
    findAll() {
        return this.treatmentsService.findAll();
    }

    @Get('doctor/:doctorId')
    findByDoctor(@Param('doctorId') doctorId: string) {
        return this.treatmentsService.findByDoctor(+doctorId);
    }

    @Get('patient/:patientId')
    findByPatient(@Param('patientId') patientId: string) {
        return this.treatmentsService.findByPatient(+patientId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.treatmentsService.findOne(+id);
    }

    @Put(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.treatmentsService.updateStatus(+id, status);
    }
}