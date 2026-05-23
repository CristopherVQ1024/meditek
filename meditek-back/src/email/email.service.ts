import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_EMAIL,    
        pass: process.env.BREVO_APIKEY    
      }
    } as any);
  }

  async sendInvoiceEmail(to: string, order: any, pdfBuffer: Buffer) {
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

    const { data, error } = await this.resend.emails.send({
      from: 'MEDITEK Farmacia <onboarding@resend.dev>',
      to,
      subject: `✅ Comprobante de pago - Orden ${order.orderNumber}`,
      html: htmlContent,
      attachments: [
        {
          filename: `comprobante-${order.orderNumber}.pdf`,
          content: pdfBuffer,
        }
      ]
    });

    if (error) throw new Error(`Error enviando correo: ${error.message}`);
    console.log('✅ Correo enviado:', data?.id);
    return data;
  }

  async sendTestEmail(to: string) {
    const { data, error } = await this.resend.emails.send({
      from: 'MEDITEK Farmacia <onboarding@resend.dev>',
      to,
      subject: '🧪 Prueba de correo - MEDITEK',
      html: `
        <h2>¡Correo de prueba!</h2>
        <p>Si estás viendo esto, la configuración de correo funciona correctamente.</p>
        <p>Fecha: ${new Date().toLocaleString()}</p>
      `
    });

    if (error) throw new Error(`Error enviando correo: ${error.message}`);
    console.log('✅ Correo de prueba enviado:', data?.id);
    return data;
  }

  async sendPrescriptionEmail(to: string, prescription: any, doctorName: string) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0A6E5E;">🏥 HOSPITAL MEDITEK</h2>
          <h3>RECETA MÉDICA</h3>
          <div style="border: 2px solid #0A6E5E; padding: 10px; display: inline-block;">
            <strong>SELLO OFICIAL</strong>
          </div>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Paciente:</strong> ${prescription.patientName}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-PE')}</p>
          <p><strong>Médico:</strong> ${doctorName}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #0A6E5E;">💊 Medicamentos</h3>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
            ${prescription.medications.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #0A6E5E;">📋 Instrucciones</h3>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
            ${prescription.instructions.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
          <div style="border-top: 1px solid #ccc; padding-top: 20px;">
            <p style="font-size: 12px; color: #666;">
              Este es un documento médico oficial.<br>
              Presente esta receta en la farmacia para su despacho.
            </p>
            <p style="font-size: 12px; color: #666;">MEDITEK - Tu salud es nuestra prioridad</p>
          </div>
        </div>
      </div>
    `;

    const { data, error } = await this.resend.emails.send({
      from: 'MEDITEK Recetas Médicas <onboarding@resend.dev>',
      to,
      subject: '📋 Receta Médica - MEDITEK',
      html: htmlContent,
    });

    if (error) throw new Error(`Error enviando correo: ${error.message}`);
    console.log('✅ Receta médica enviada a:', to);
    return data;
  }
}