import { Test, TestingModule } from '@nestjs/testing';
import { MedicalHistoryController } from './medical-history.controller';

describe('MedicalHistoryController', () => {
  let controller: MedicalHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicalHistoryController],
    }).compile();

    controller = module.get<MedicalHistoryController>(MedicalHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
