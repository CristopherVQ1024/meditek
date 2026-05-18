import { Controller, Post, Put, Get, Param, Body, UseInterceptors, UploadedFiles, BadRequestException, Delete } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MedicalHistoryService } from './medical-history.service';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { Express } from 'express';

@Controller('medical-history')
export class MedicalHistoryController {
    constructor(
        private medicalHistoryService: MedicalHistoryService,
        private prisma: PrismaService
    ) { }

    @Get('patient/:patientId')
    async findByPatient(@Param('patientId') patientId: string) {
        const history = await this.medicalHistoryService.findByPatient(parseInt(patientId));

        // Obtener imágenes asociadas
        const images = await this.prisma.medicalImage.findMany({
            where: { patientId: parseInt(patientId) },
            orderBy: { createdAt: 'desc' }
        });

        return { ...history, images };
    }

    @Put('patient/:patientId')
    async update(@Param('patientId') patientId: string, @Body() data: any) {
        return this.medicalHistoryService.update(parseInt(patientId), data);
    }

    @Post('upload-images/:patientId')
    @UseInterceptors(FilesInterceptor('images', 10, {
        storage: diskStorage({
            destination: './uploads/medical-images',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `patient-${req.params.patientId}-${uniqueSuffix}${extname(file.originalname)}`);
            }
        }),
        fileFilter: (req, file, cb) => {
            const allowedTypes = /jpeg|jpg|png|gif|pdf/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);
            
            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new BadRequestException('Solo se permiten imágenes y PDFs'), false);
            }
        }
    }))
    async uploadImages(
        @Param('patientId') patientId: string, 
        @UploadedFiles() files: Express.Multer.File[]
    ): Promise<any[]> {
        const savedImages: any[] = [];
        
        if (!files || files.length === 0) {
            throw new BadRequestException('No se recibieron archivos');
        }
        
        for (const file of files) {
            try {
                const image = await this.prisma.medicalImage.create({
                    data: {
                        patientId: parseInt(patientId),
                        filename: file.filename,
                        originalName: file.originalname,
                        filePath: file.path.replace(/\\/g, '/'), 
                        mimeType: file.mimetype,
                        fileSize: file.size
                    }
                });
                savedImages.push(image);
            } catch (error) {
                console.error('Error al guardar imagen:', error);
                throw new BadRequestException(`Error al guardar la imagen: ${file.originalname}`);
            }
        }
        
        return savedImages;
    }
    @Delete('image/:imageId')
    async deleteImage(@Param('imageId') imageId: string) {
        const image = await this.prisma.medicalImage.findUnique({
            where: { id: parseInt(imageId) }
        });

        if (image) {
            // Eliminar archivo físico
            const filePath = path.join(__dirname, '../../..', image.filePath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            // Eliminar registro
            await this.prisma.medicalImage.delete({
                where: { id: parseInt(imageId) }
            });
        }

        return { message: 'Imagen eliminada' };
    }
}