import { Controller, Get, Post, Body, Put, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { SpecialtiesService } from './specialties.service';

@Controller('specialties')
export class SpecialtiesController {
    constructor(private readonly specialtiesService: SpecialtiesService) { }

    @Post()
    create(@Body() body: any) {
        return this.specialtiesService.create(body);
    }

    @Get()
    findAll() {
        return this.specialtiesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.specialtiesService.findOne(+id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.specialtiesService.update(+id, body);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.specialtiesService.remove(+id);
    }
}