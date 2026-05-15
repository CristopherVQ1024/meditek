import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { PatientsService } from './patients.service';

@Controller('patients')
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    @Post()
    create(@Body() body: any) {
        return this.patientsService.create(body);
    }

    @Get()
    findAll() {
        return this.patientsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.patientsService.findOne(+id);
    }

    @Get(':id/medical-history')
    getMedicalHistory(@Param('id') id: string) {
        return this.patientsService.getMedicalHistory(+id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.patientsService.update(+id, body);
    }

    @Put(':id/medical-history')
    updateMedicalHistory(@Param('id') id: string, @Body() body: any) {
        return this.patientsService.updateMedicalHistory(+id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.patientsService.remove(+id);
    }

    @Get('by-user/:userId')
    async findByUserId(@Param('userId') userId: string) {
        return this.patientsService.findByUserId(+userId);
    }
}