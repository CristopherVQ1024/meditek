import { Test, TestingModule } from '@nestjs/testing';
import { TreatmentsService } from './treatments.service';

describe('TreatmentsService', () => {
  let service: TreatmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TreatmentsService],
    }).compile();

    service = module.get<TreatmentsService>(TreatmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
