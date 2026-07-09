import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phase, PhaseImage } from '../phases/entities/phase.entity';
import { Step, StepImage } from '../steps/entities/step.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
  ) {}

  async onApplicationBootstrap() {
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
    let currentStepData: { title: string; details: string[] } | null = null;
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
          if (detail) currentStepData.details.push(detail);
        }
      } else if (currentStepData && line && !line.startsWith('---') && !line.startsWith('##')) {
        const detail = line.replace(/^[\*\-\s]+/, '').trim();
        if (detail) currentStepData.details.push(detail);
      }
    }

    if (currentStepData && currentPhase) {
      await this.saveStep(currentPhase, currentStepData);
    }

    console.log('Seeder seeding process complete!');
  }

  async saveStep(phase: Phase, data: { title: string; details: string[] }) {
    const step = new Step();
    step.phase_id = phase._id.toString();
    step.title = data.title;
    step.details = JSON.stringify(data.details);
    step.done = 0;

    const sImg1 = new StepImage(); sImg1.url = '/images/phase1.png';
    const sImg2 = new StepImage(); sImg2.url = '/images/phase2.png';
    const sImg3 = new StepImage(); sImg3.url = '/images/phase3.png';
    const sImg4 = new StepImage(); sImg4.url = '/images/phase4.png';
    step.images = [sImg1, sImg2, sImg3, sImg4];

    await this.stepRepository.save(step);
  }
}
