import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Phase } from './entities/phase.entity';
import { PhasesController } from './phases.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Phase])],
  controllers: [PhasesController],
  exports: [TypeOrmModule],
})
export class PhasesModule {}
