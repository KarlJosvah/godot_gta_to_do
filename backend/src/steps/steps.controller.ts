import { Controller, Get, Param, Post, Patch, Delete, Body, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Step, StepImage } from './entities/step.entity';
import { Phase } from '../phases/entities/phase.entity';
import { ObjectId } from 'mongodb';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateStepDto } from './dto/create-step.dto';

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
      task_type: step.task_type || 'NONE',
      details: JSON.parse(step.details || '[]'),
      done: step.done,
      image_urls: (step.images || []).map((img) => img.url),
    }));
  }

  @Post('steps')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './public/uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async create(
    @Body() createDto: CreateStepDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const step = new Step();
    step.phase_id = createDto.phase_id;
    step.title = createDto.title;
    step.task_type = createDto.task_type || 'NONE';
    step.details = createDto.details || '[]';
    step.done = 0;

    const urls = files ? files.map((file) => `/uploads/${file.filename}`) : [];
    step.images = urls.map((url) => {
      const img = new StepImage();
      img.url = url;
      return img;
    });

    const saved = await this.stepRepository.save(step);

    // Update parent phase done status
    await this.updatePhaseStatus(step.phase_id);

    return {
      id: saved._id.toString(),
      phase_id: saved.phase_id,
      title: saved.title,
      task_type: saved.task_type,
      details: JSON.parse(saved.details),
      done: saved.done,
      image_urls: saved.images.map((img) => img.url),
    };
  }

  @Patch('steps/:id')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './public/uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const objectId = new ObjectId(id);
    const step = await this.stepRepository.findOne({
      where: { _id: objectId } as any,
    });
    if (!step) {
      throw new Error('Step not found');
    }

    if (updateDto.title !== undefined) {
      step.title = updateDto.title;
    }
    if (updateDto.task_type !== undefined) {
      step.task_type = updateDto.task_type;
    }
    if (updateDto.details !== undefined) {
      step.details = updateDto.details;
    }

    if (files && files.length > 0) {
      const urls = files.map((file) => `/uploads/${file.filename}`);
      step.images = urls.map((url) => {
        const img = new StepImage();
        img.url = url;
        return img;
      });
    }

    const saved = await this.stepRepository.save(step);
    await this.updatePhaseStatus(step.phase_id);

    return {
      id: saved._id.toString(),
      phase_id: saved.phase_id,
      title: saved.title,
      task_type: saved.task_type,
      details: JSON.parse(saved.details),
      done: saved.done,
      image_urls: saved.images.map((img) => img.url),
    };
  }

  @Delete('steps/:id')
  async delete(@Param('id') id: string) {
    const objectId = new ObjectId(id);
    const step = await this.stepRepository.findOne({
      where: { _id: objectId } as any,
    });
    if (!step) {
      throw new Error('Step not found');
    }

    const phaseId = step.phase_id;
    await this.stepRepository.delete({ _id: objectId } as any);
    await this.updatePhaseStatus(phaseId);

    return { success: true };
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

    const newPhaseDone = await this.updatePhaseStatus(step.phase_id);

    return {
      stepId: step._id.toString(),
      stepDone: step.done,
      phaseId: step.phase_id,
      phaseDone: newPhaseDone,
    };
  }

  private async updatePhaseStatus(phaseIdStr: string): Promise<number> {
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

    return newPhaseDone;
  }
}
