import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { trainingMulterConfig } from './training.config';

@Module({
  imports: [
    MulterModule.register(trainingMulterConfig),
  ],
  controllers: [TrainingController],
  providers: [TrainingService],
  exports: [TrainingService],
})
export class TrainingModule {}