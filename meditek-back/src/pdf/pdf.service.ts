import { Injectable } from '@nestjs/common';

@Injectable()
export class PdfService {
    async generateInvoice(order: any): Promise<Buffer> {
        // Usar require en lugar de import
        const PDFDocument = require('pdfkit');

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const buffers: Buffer[] = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });
                doc.on('error', reject);

                // Header
                doc.fontSize(20)
                    .text('MEDITEK - COMPROBANTE DE PAGO', { align: 'center' })
                    .moveDown();

                doc.fontSize(12)
                    .text(`N° Orden: ${order.orderNumber}`, { align: 'right' })
                    .text(`Fecha: ${new Date(order.createdAt).toLocaleString('es-PE')}`, { align: 'right' })
                    .moveDown();

                // Información del cliente
                doc.fontSize(14).text('DATOS DEL CLIENTE', { underline: true })
                    .moveDown(0.5);

                doc.fontSize(10)
                    .text(`Nombre: ${order.customerName}`)
                    .text(`Email: ${order.customerEmail}`)
                    .text(`Teléfono: ${order.customerPhone || 'No especificado'}`)
                    .text(`Dirección: ${order.customerAddress}`)
                    .moveDown();

                // Detalle de productos
                doc.fontSize(14).text('DETALLE DEL PEDIDO', { underline: true })
                    .moveDown(0.5);

                // Tabla de productos
                const tableTop = doc.y;
                let currentTop = tableTop;

                // Headers de la tabla
                doc.fontSize(10)
                    .text('Producto', 50, currentTop, { width: 250 })
                    .text('Cantidad', 300, currentTop, { width: 80, align: 'center' })
                    .text('Precio', 380, currentTop, { width: 80, align: 'right' })
                    .text('Subtotal', 460, currentTop, { width: 80, align: 'right' });

                currentTop += 20;

                // Línea separadora
                doc.moveTo(50, currentTop - 5)
                    .lineTo(550, currentTop - 5)
                    .stroke();

                // Productos
                for (const item of order.items) {
                    doc.text(item.product.name, 50, currentTop, { width: 250 })
                        .text(item.quantity.toString(), 300, currentTop, { width: 80, align: 'center' })
                        .text(`S/ ${item.price.toFixed(2)}`, 380, currentTop, { width: 80, align: 'right' })
                        .text(`S/ ${item.subtotal.toFixed(2)}`, 460, currentTop, { width: 80, align: 'right' });

                    currentTop += 20;

                    // Si la página se llena, crear nueva página
                    if (currentTop > 700) {
                        doc.addPage();
                        currentTop = 50;
                        // Reimprimir headers en nueva página
                        doc.fontSize(10)
                            .text('Producto', 50, currentTop, { width: 250 })
                            .text('Cantidad', 300, currentTop, { width: 80, align: 'center' })
                            .text('Precio', 380, currentTop, { width: 80, align: 'right' })
                            .text('Subtotal', 460, currentTop, { width: 80, align: 'right' });
                        currentTop += 20;
                        doc.moveTo(50, currentTop - 5)
                            .lineTo(550, currentTop - 5)
                            .stroke();
                    }
                }

                // Línea separadora
                doc.moveTo(50, currentTop - 5)
                    .lineTo(550, currentTop - 5)
                    .stroke();

                // Total
                currentTop += 10;
                doc.fontSize(12)
                    .font('Helvetica-Bold')
                    .text(`TOTAL: S/ ${order.total.toFixed(2)}`, 460, currentTop, {
                        width: 80,
                        align: 'right'
                    });

                // Estado del pago
                doc.font('Helvetica')
                    .moveDown(2);
                doc.fontSize(10)
                    .text(`Estado del pago: ${order.paymentStatus}`, { align: 'center' })
                    .text(`Método de pago: ${order.paymentMethod || 'Pendiente'}`, { align: 'center' })
                    .moveDown();

                doc.fontSize(8)
                    .text('Gracias por su compra', { align: 'center' })
                    .text('MEDITEK - Tu salud es nuestra prioridad', { align: 'center' });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}