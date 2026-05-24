import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {

  private async sendEmail(to: string, subject: string, htmlContent: string, attachments?: any[]) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_APIKEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { email: process.env.BREVO_EMAIL, name: 'MEDITEK' },
        to: [{ email: to }],
        subject,
        htmlContent,
        ...(attachments && { attachment: attachments })
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error Brevo: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log('✅ Correo enviado:', data.messageId);
    return data;
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
        <p style="color: #666; font-size: 12px;">MEDITEK - Tu salud es nuestra prioridad</p>
      </div>
    `;

    return this.sendEmail(to, `✅ Comprobante de pago - Orden ${order.orderNumber}`, htmlContent, [
      {
        name: `comprobante-${order.orderNumber}.pdf`,
        content: pdfBuffer.toString('base64')
      }
    ]);
  }

  async sendTestEmail(to: string) {
    return this.sendEmail(to, '🧪 Prueba de correo - MEDITEK', `
      <h2>¡Correo de prueba!</h2>
      <p>Si estás viendo esto, la configuración funciona correctamente.</p>
      <p>Fecha: ${new Date().toLocaleString()}</p>
    `);
  }

  async sendPrescriptionEmail(to: string, prescription: any, doctorName: string) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0A6E5E;">🏥 HOSPITAL MEDITEK</h2>
          <h3>RECETA MÉDICA</h3>
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
        <p style="font-size: 12px; color: #666; text-align: center;">
          Este es un documento médico oficial. Presente esta receta en la farmacia.<br>
          MEDITEK - Tu salud es nuestra prioridad
        </p>
      </div>
    `;

    return this.sendEmail(to, '📋 Receta Médica - MEDITEK', htmlContent);
  }
}