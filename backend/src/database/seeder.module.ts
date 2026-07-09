import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Phase } from '../phases/entities/phase.entity';
import { Step } from '../steps/entities/step.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Phase, Step])],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
