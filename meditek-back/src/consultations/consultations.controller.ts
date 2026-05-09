import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';

@Controller('consultations')
export class ConsultationsController {
    constructor(private readonly consultationsService: ConsultationsService) { }

    @Post()
    create(@Body() body: any) {
        return this.consultationsService.create(body);
    }

    @Get()
    findAll() {
        return this.consultationsService.findAll();
    }

    @Get('doctor/:userId')
    findByDoctor(@Param('userId') userId: string) {
        return this.consultationsService.findByDoctor(+userId);
    }

    @Get('patient/:patientId')
    findByPatient(@Param('patientId') patientId: string) {
        return this.consultationsService.findByPatient(+patientId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.consultationsService.findOne(+id);
    }
}