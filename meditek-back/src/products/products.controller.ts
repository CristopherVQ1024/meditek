import { Controller, Get, Post, Body, Put, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }
    @Post()
    create(@Body() body: any) {
        return this.productsService.create(body);
    }

    @Public() 
    @Get()
    findAll() {
        return this.productsService.findAll();
    }
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(+id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.productsService.update(+id, body);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.productsService.remove(+id);
    }
}