import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Phase } from './entities/phase.entity';
import { PhasesController } from './phases.controller';
import { Step } from '../steps/entities/step.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Phase, Step]), CloudinaryModule],
  controllers: [PhasesController],
  exports: [TypeOrmModule],
})
export class PhasesModule {}
