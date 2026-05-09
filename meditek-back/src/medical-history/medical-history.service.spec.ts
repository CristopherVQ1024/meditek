import { Test, TestingModule } from '@nestjs/testing';
import { MedicalHistoryService } from './medical-history.service';

describe('MedicalHistoryService', () => {
  let service: MedicalHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicalHistoryService],
    }).compile();

    service = module.get<MedicalHistoryService>(MedicalHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
