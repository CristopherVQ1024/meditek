import { Controller, Get, Header } from '@nestjs/common';
import * as client from 'prom-client';
import { Public } from '../auth/decorators/public.decorator';

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
});

@Controller()
export class MetricsController {

  @Public()
  @Get('metrics')
  @Header('Content-Type', register.contentType)
  async metrics() {
    return register.metrics();
  }
}