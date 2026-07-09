import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phase } from './entities/phase.entity';

@Controller('phases')
export class PhasesController {
  constructor(
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
  ) {}

  @Get()
  async findAll() {
    const phases = await this.phaseRepository.find();
    return phases.map((phase) => ({
      id: phase._id.toString(),
      title: phase.title,
      description: phase.description,
      done: phase.done,
      image_urls: (phase.images || []).map((img) => img.url),
    }));
  }
}
