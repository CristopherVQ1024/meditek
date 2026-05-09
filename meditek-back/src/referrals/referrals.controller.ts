import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
export class ReferralsController {
    constructor(private readonly referralsService: ReferralsService) { }

    @Post()
    create(@Body() body: any) {
        return this.referralsService.create(body);
    }

    @Get()
    findAll() {
        return this.referralsService.findAll();
    }

    @Get('doctor/:doctorId')
    findByDoctor(@Param('doctorId') doctorId: string) {
        return this.referralsService.findByDoctor(+doctorId);
    }

    @Get('patient/:patientId')
    findByPatient(@Param('patientId') patientId: string) {
        return this.referralsService.findByPatient(+patientId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.referralsService.findOne(+id);
    }
}