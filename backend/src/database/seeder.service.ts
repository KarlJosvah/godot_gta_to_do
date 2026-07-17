import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phase, PhaseImage } from '../phases/entities/phase.entity';
import { Step, StepImage } from '../steps/entities/step.entity';
import { UsersService } from '../auth/users.service';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
    private readonly usersService: UsersService,
  ) {}

  async onApplicationBootstrap() {
    // Seed user admin if none exists
    const usersCount = await this.usersService.count();
    if (usersCount === 0) {
      console.log('Seeding default administrator account user: admin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await this.usersService.create({
        username: 'admin',
        password: hashedPassword,
      });
    }

    const phasesCount = await this.phaseRepository.count();
    if (phasesCount === 0) {
      console.log('Database empty! Triggering database seeder module...');
      await this.seed();
    } else {
      console.log('Database already populated. Skipping seeder.');
    }
  }

  async seed() {
    const planPath = path.join(__dirname, '..', '..', '..', 'plan.md');
    if (!fs.existsSync(planPath)) {
      console.error(`plan.md file not found at ${planPath}`);
      return;
    }

    const content = fs.readFileSync(planPath, 'utf-8');
    const lines = content.split('\n');

    let currentPhase: Phase | null = null;
    let currentStepData: { title: string; details: { text: string; task_type: string }[] } | null = null;
    let phaseIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('## Phase')) {
        if (currentStepData && currentPhase) {
          await this.saveStep(currentPhase, currentStepData);
          currentStepData = null;
        }

        phaseIndex++;
        const title = line.replace('##', '').trim();
        
        let descriptionLines: string[] = [];
        let nextIdx = i + 1;
        while (nextIdx < lines.length && !lines[nextIdx].trim().startsWith('*') && !lines[nextIdx].trim().startsWith('---') && !lines[nextIdx].trim().startsWith('##')) {
          const descLine = lines[nextIdx].trim();
          if (descLine) descriptionLines.push(descLine);
          nextIdx++;
        }
        i = nextIdx - 1;

        const phase = new Phase();
        phase.title = title;
        phase.description = descriptionLines.join('\n');
        phase.done = 0;

        const pImg1 = new PhaseImage(); pImg1.url = '/images/phase1.png';
        const pImg2 = new PhaseImage(); pImg2.url = '/images/phase2.png';
        const pImg3 = new PhaseImage(); pImg3.url = '/images/phase3.png';
        const pImg4 = new PhaseImage(); pImg4.url = '/images/phase4.png';
        phase.images = [pImg1, pImg2, pImg3, pImg4];

        currentPhase = await this.phaseRepository.save(phase);
      } else if (line.startsWith('*') && line.includes('Step')) {
        if (currentStepData && currentPhase) {
          await this.saveStep(currentPhase, currentStepData);
        }

        const cleanTitle = line.replace(/^\*\s+/, '').replace(/\*\*/g, '').trim();
        currentStepData = {
          title: cleanTitle,
          details: []
        };
      } else if (line.startsWith('*') || line.startsWith('-') || line.startsWith('`*`')) {
        if (currentStepData) {
          const detail = line.replace(/^[\*\-\`\s]+/, '').replace(/\*\*/g, '').trim();
          if (detail) {
            let taskType = 'NONE';
            let cleanDetail = detail;
            if (detail.toLowerCase().startsWith('*asset task:*')) {
              taskType = 'ASSET';
              cleanDetail = detail.substring(13).trim();
            } else if (detail.toLowerCase().startsWith('asset task:')) {
              taskType = 'ASSET';
              cleanDetail = detail.substring(11).trim();
            } else if (detail.toLowerCase().startsWith('*code task:*')) {
              taskType = 'CODE';
              cleanDetail = detail.substring(12).trim();
            } else if (detail.toLowerCase().startsWith('code task:')) {
              taskType = 'CODE';
              cleanDetail = detail.substring(10).trim();
            }
            // Strip any remaining starting/trailing asterisks for italics if any
            if (cleanDetail.startsWith('*') && cleanDetail.endsWith('*')) {
              cleanDetail = cleanDetail.substring(1, cleanDetail.length - 1).trim();
            } else if (cleanDetail.startsWith('*')) {
              cleanDetail = cleanDetail.substring(1).trim();
            }
            currentStepData.details.push({ text: cleanDetail, task_type: taskType });
          }
        }
      } else if (currentStepData && line && !line.startsWith('---') && !line.startsWith('##')) {
        const detail = line.replace(/^[\*\-\s]+/, '').trim();
        if (detail) {
          let taskType = 'NONE';
          let cleanDetail = detail;
          if (detail.toLowerCase().startsWith('*asset task:*')) {
            taskType = 'ASSET';
            cleanDetail = detail.substring(13).trim();
          } else if (detail.toLowerCase().startsWith('asset task:')) {
            taskType = 'ASSET';
            cleanDetail = detail.substring(11).trim();
          } else if (detail.toLowerCase().startsWith('*code task:*')) {
            taskType = 'CODE';
            cleanDetail = detail.substring(12).trim();
          } else if (detail.toLowerCase().startsWith('code task:')) {
            taskType = 'CODE';
            cleanDetail = detail.substring(10).trim();
          }
          if (cleanDetail.startsWith('*') && cleanDetail.endsWith('*')) {
            cleanDetail = cleanDetail.substring(1, cleanDetail.length - 1).trim();
          } else if (cleanDetail.startsWith('*')) {
            cleanDetail = cleanDetail.substring(1).trim();
          }
          currentStepData.details.push({ text: cleanDetail, task_type: taskType });
        }
      }
    }

    if (currentStepData && currentPhase) {
      await this.saveStep(currentPhase, currentStepData);
    }

    console.log('Seeder seeding process complete!');
  }

  async saveStep(phase: Phase, data: { title: string; details: { text: string; task_type: string }[] }) {
    const step = new Step();
    step.phase_id = phase._id.toString();
    step.title = data.title;
    step.details = JSON.stringify(data.details);
    step.done = 0;

    const hasAsset = data.details.some(d => d.task_type === 'ASSET');
    const hasCode = data.details.some(d => d.task_type === 'CODE');
    if (hasAsset && !hasCode) {
      step.task_type = 'ASSET';
    } else if (hasCode && !hasAsset) {
      step.task_type = 'CODE';
    } else {
      step.task_type = 'NONE';
    }

    const sImg1 = new StepImage(); sImg1.url = '/images/phase1.png';
    const sImg2 = new StepImage(); sImg2.url = '/images/phase2.png';
    const sImg3 = new StepImage(); sImg3.url = '/images/phase3.png';
    const sImg4 = new StepImage(); sImg4.url = '/images/phase4.png';
    step.images = [sImg1, sImg2, sImg3, sImg4];

    await this.stepRepository.save(step);
  }
}
