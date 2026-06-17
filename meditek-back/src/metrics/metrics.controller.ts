import { Controller, Get, Header } from '@nestjs/common';
import * as client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
});

@Controller()
export class MetricsController {
  @Get('metrics')
  @Header('Content-Type', register.contentType)
  async metrics() {
    return register.metrics();
  }
}