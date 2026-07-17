import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PhasesModule } from './phases/phases.module';
import { StepsModule } from './steps/steps.module';
import { SeederModule } from './database/seeder.module';
import { Phase } from './phases/entities/phase.entity';
import { Step } from './steps/entities/step.entity';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: process.env.MONGODB_URL,
      entities: [Phase, Step, User],
      synchronize: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    PhasesModule,
    StepsModule,
    SeederModule,
    CloudinaryModule,
    AuthModule,
  ],
})
export class AppModule {}
