import { Controller, Get, Post, Body, Put, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';

@Controller('prescriptions')
export class PrescriptionsController {
    constructor(private readonly prescriptionsService: PrescriptionsService) { }

    @Post()
    create(@Body() body: any) {
        return this.prescriptionsService.create(body);
    }

    @Get()
    findAll() {
        return this.prescriptionsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.prescriptionsService.findOne(+id);
    }

    @Get('patient/:patientId')
    findByPatient(@Param('patientId') patientId: string) {
        return this.prescriptionsService.findByPatient(+patientId);
    }

    @Get('consultation/:consultationId')
    findByConsultation(@Param('consultationId') consultationId: string) {
        return this.prescriptionsService.findByConsultation(+consultationId);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.prescriptionsService.update(+id, body);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.prescriptionsService.remove(+id);
    }
}