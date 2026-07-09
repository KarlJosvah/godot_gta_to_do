import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhasesModule } from './phases/phases.module';
import { StepsModule } from './steps/steps.module';
import { SeederModule } from './database/seeder.module';
import { Phase } from './phases/entities/phase.entity';
import { Step } from './steps/entities/step.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: 'mongodb://localhost:27017/gta_todo',
      entities: [Phase, Step],
      synchronize: true,
    }),
    PhasesModule,
    StepsModule,
    SeederModule,
  ],
})
export class AppModule {}
