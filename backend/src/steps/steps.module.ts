import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Step } from './entities/step.entity';
import { StepsController } from './steps.controller';
import { Phase } from '../phases/entities/phase.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Step, Phase]), CloudinaryModule],
  controllers: [StepsController],
  exports: [TypeOrmModule],
})
export class StepsModule {}
