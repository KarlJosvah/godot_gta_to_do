import { Controller, Get, Post, Patch, Delete, Body, Param, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phase, PhaseImage } from './entities/phase.entity';
import { Step } from '../steps/entities/step.entity';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { ObjectId } from 'mongodb';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('phases')
export class PhasesController {
  constructor(
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
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

  @Post()
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
    @Body() createDto: CreatePhaseDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const phase = new Phase();
    phase.title = createDto.title;
    phase.description = createDto.description || '';
    phase.done = 0;

    const urls = files ? files.map((file) => `/uploads/${file.filename}`) : [];
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

  @Patch(':id')
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
    @Body() updateDto: CreatePhaseDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const objectId = new ObjectId(id);
    const phase = await this.phaseRepository.findOne({
      where: { _id: objectId } as any,
    });
    if (!phase) {
      throw new Error('Phase not found');
    }

    if (updateDto.title !== undefined) {
      phase.title = updateDto.title;
    }
    if (updateDto.description !== undefined) {
      phase.description = updateDto.description;
    }

    // If new files are uploaded, append/overwrite existing images list
    if (files && files.length > 0) {
      const urls = files.map((file) => `/uploads/${file.filename}`);
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

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const objectId = new ObjectId(id);
    const phase = await this.phaseRepository.findOne({
      where: { _id: objectId } as any,
    });
    if (!phase) {
      throw new Error('Phase not found');
    }

    // Delete child steps
    await this.stepRepository.delete({ phase_id: id });
    // Delete phase document
    await this.phaseRepository.delete({ _id: objectId } as any);

    return { success: true };
  }
}
