import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhasesModule } from './phases/phases.module';
import { StepsModule } from './steps/steps.module';
import { SeederModule } from './database/seeder.module';
import { Phase } from './phases/entities/phase.entity';
import { Step } from './steps/entities/step.entity';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: 'mongodb://localhost:27017/gta_todo',
      entities: [Phase, Step],
      synchronize: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    PhasesModule,
    StepsModule,
    SeederModule,
  ],
})
export class AppModule {}
