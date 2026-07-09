import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Phase } from './entities/phase.entity';
import { PhasesController } from './phases.controller';
import { Step } from '../steps/entities/step.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Phase, Step])],
  controllers: [PhasesController],
  exports: [TypeOrmModule],
})
export class PhasesModule {}
