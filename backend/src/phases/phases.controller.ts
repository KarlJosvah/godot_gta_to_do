import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseInterceptors, UploadedFiles, UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phase, PhaseImage } from './entities/phase.entity';
import { Step } from '../steps/entities/step.entity';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { ObjectId } from 'mongodb';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('phases')
export class PhasesController {
  constructor(
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
    private readonly cloudinaryService: CloudinaryService,
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

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, { storage: memoryStorage() }))
  async create(
    @Body() createDto: CreatePhaseDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const phase = new Phase();
    phase.title = createDto.title;
    phase.description = createDto.description || '';
    phase.done = 0;

    const urls = files && files.length > 0
      ? await this.cloudinaryService.uploadFiles(files)
      : [];

    phase.images = urls.map((url) => {
      const img = new PhaseImage();
      img.url = url;
      return img;
    });

    const saved = await this.phaseRepository.save(phase);
    return {
      id: saved._id.toString(),
      title: saved.title,
      description: saved.description,
      done: saved.done,
      image_urls: saved.images.map((img) => img.url),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files', 10, { storage: memoryStorage() }))
  async update(
    @Param('id') id: string,
    @Body() updateDto: CreatePhaseDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const objectId = new ObjectId(id);
    const phase = await this.phaseRepository.findOne({
      where: { _id: objectId } as any,
    });
    if (!phase) throw new Error('Phase not found');

    if (updateDto.title !== undefined) phase.title = updateDto.title;
    if (updateDto.description !== undefined) phase.description = updateDto.description;

    if (files && files.length > 0) {
      const urls = await this.cloudinaryService.uploadFiles(files);
      phase.images = urls.map((url) => {
        const img = new PhaseImage();
        img.url = url;
        return img;
      });
    }

    const saved = await this.phaseRepository.save(phase);
    return {
      id: saved._id.toString(),
      title: saved.title,
      description: saved.description,
      done: saved.done,
      image_urls: saved.images.map((img) => img.url),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    const objectId = new ObjectId(id);
    const phase = await this.phaseRepository.findOne({
      where: { _id: objectId } as any,
    });
    if (!phase) throw new Error('Phase not found');

    await this.stepRepository.delete({ phase_id: id });
    await this.phaseRepository.delete({ _id: objectId } as any);

    return { success: true };
  }
}
