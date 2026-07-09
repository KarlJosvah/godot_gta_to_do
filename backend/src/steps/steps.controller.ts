import { Controller, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Step } from './entities/step.entity';
import { Phase } from '../phases/entities/phase.entity';
import { ObjectId } from 'mongodb';

@Controller()
export class StepsController {
  constructor(
    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
  ) {}

  @Get('phases/:phaseId/steps')
  async findByPhase(@Param('phaseId') phaseId: string) {
    const steps = await this.stepRepository.find({
      where: { phase_id: phaseId },
    });
    return steps.map((step) => ({
      id: step._id.toString(),
      phase_id: phaseId,
      title: step.title,
      details: JSON.parse(step.details || '[]'),
      done: step.done,
      image_urls: (step.images || []).map((img) => img.url),
    }));
  }

  @Post('steps/:id/toggle')
  async toggle(@Param('id') id: string) {
    const objectId = new ObjectId(id);
    const step = await this.stepRepository.findOne({
      where: { _id: objectId } as any,
    });
    if (!step) {
      throw new Error('Step not found');
    }

    step.done = step.done === 1 ? 0 : 1;
    await this.stepRepository.save(step);

    // Compute parent phase state
    const phaseIdStr = step.phase_id;
    const allSteps = await this.stepRepository.find({
      where: { phase_id: phaseIdStr },
    });
    
    const allDone = allSteps.length > 0 && allSteps.every((s) => s.done === 1);
    const newPhaseDone = allDone ? 1 : 0;

    const phaseObjectId = new ObjectId(phaseIdStr);
    await this.phaseRepository.update(
      { _id: phaseObjectId } as any,
      { done: newPhaseDone }
    );

    return {
      stepId: step._id.toString(),
      stepDone: step.done,
      phaseId: phaseIdStr,
      phaseDone: newPhaseDone,
    };
  }
}
