import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { MedicalHistoryService } from './medical-history.service';

@Controller('medical-history')
export class MedicalHistoryController {
    constructor(private readonly medicalHistoryService: MedicalHistoryService) { }

    @Get('patient/:patientId')
    findByPatient(@Param('patientId') patientId: string) {
        return this.medicalHistoryService.findByPatient(+patientId);
    }

    @Put('patient/:patientId')
    update(@Param('patientId') patientId: string, @Body() body: any) {
        return this.medicalHistoryService.update(+patientId, body);
    }
}