import { Test, TestingModule } from '@nestjs/testing';
import { TreatmentsController } from './treatments.controller';

describe('TreatmentsController', () => {
  let controller: TreatmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TreatmentsController],
    }).compile();

    controller = module.get<TreatmentsController>(TreatmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
