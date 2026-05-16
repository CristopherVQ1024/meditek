import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter;

    constructor() {
        // Configuración simple para Gmail
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'cris.vera.quispe@gmail.com',
                pass: 'ymnb ifha ifzz cjxo'
            }
        });
    }

    async sendInvoiceEmail(to: string, order: any, pdfBuffer: Buffer) {
        // Crear el contenido HTML del correo
        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0A6E5E;">¡Gracias por tu compra!</h2>
        <p>Hola <strong>${order.customerName}</strong>,</p>
        <p>Tu pedido ha sido confirmado exitosamente. Adjunto encontrarás el comprobante de pago.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalle del pedido</h3>
          <p><strong>N° Orden:</strong> ${order.orderNumber}</p>
          <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString('es-PE')}</p>
          <p><strong>Total:</strong> S/ ${order.total.toFixed(2)}</p>
          
          <h4>Productos:</h4>
          <ul>
            ${order.items.map(item => `
              <li>${item.quantity}x ${item.product.name} - S/ ${item.subtotal.toFixed(2)}</li>
            `).join('')}
          </ul>
        </div>
        
        <p><strong>Dirección de entrega:</strong><br>${order.customerAddress}</p>
        
        <p>Tu pedido está siendo procesado y será enviado próximamente.</p>
        
        <hr style="margin: 20px 0;">
        
        <p style="color: #666; font-size: 12px;">
          MEDITEK - Tu salud es nuestra prioridad<br>
          Si tienes alguna consulta, responde a este correo.
        </p>
      </div>
    `;

        // Enviar el correo
        const info = await this.transporter.sendMail({
            from: '"MEDITEK Farmacia" <cris.vera.quispe@gmail.com>',
            to: to,
            subject: `✅ Comprobante de pago - Orden ${order.orderNumber}`,
            html: htmlContent,
            attachments: [
                {
                    filename: `comprobante-${order.orderNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });

        console.log('✅ Correo enviado:', info.messageId);
        return info;
    }

    // Método simple para probar el envío de correos
    async sendTestEmail(to: string) {
        const info = await this.transporter.sendMail({
            from: '"MEDITEK Farmacia" <cris.vera.quispe@gmail.com>',
            to: to,
            subject: '🧪 Prueba de correo - MEDITEK',
            html: `
        <h2>¡Correo de prueba!</h2>
        <p>Si estás viendo esto, la configuración de correo funciona correctamente.</p>
        <p>Fecha: ${new Date().toLocaleString()}</p>
      `
        });
        console.log('✅ Correo de prueba enviado:', info.messageId);
        return info;
    }
}