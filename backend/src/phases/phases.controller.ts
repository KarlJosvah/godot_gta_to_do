import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseInterceptors, UploadedFiles, UseGuards, Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phase, PhaseImage } from './entities/phase.entity';
import { Step, StepImage } from '../steps/entities/step.entity';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { ObjectId } from 'mongodb';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadedFile } from '@nestjs/common';

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

  @Get('export')
  async exportMarkdown(@Res() res: Response) {
    const phases = await this.phaseRepository.find();

    const lines: string[] = [
      '# Open-World Sandbox Project: Comprehensive Architecture & Asset Roadmap',
      '',
    ];

    for (const phase of phases) {
      const phaseId = phase._id.toString();
      lines.push(`## ${phase.title}`);
      if (phase.description) lines.push(phase.description);

      // Phase images
      const phaseImages = (phase.images || []).map((img) => img.url).filter(Boolean);
      if (phaseImages.length > 0) {
        lines.push('');
        for (const url of phaseImages) {
          lines.push(`![](${url})`);
        }
      }

      lines.push('');

      const steps = await this.stepRepository.find({
        where: { phase_id: phaseId },
      });

      for (const step of steps) {
        lines.push(`* **${step.title}**`);
        const details: { text: string; task_type: string }[] = JSON.parse(step.details || '[]');
        for (const detail of details) {
          if (detail.task_type === 'ASSET') {
            lines.push(`    * *Asset Task:* ${detail.text}`);
          } else if (detail.task_type === 'CODE') {
            lines.push(`    * *Code Task:* ${detail.text}`);
          } else {
            lines.push(`    * ${detail.text}`);
          }
        }

        // Step images
        const stepImages = (step.images || []).map((img) => img.url).filter(Boolean);
        if (stepImages.length > 0) {
          for (const url of stepImages) {
            lines.push(`    * ![](${url})`);
          }
        }
      }

      lines.push('');
      lines.push('---');
      lines.push('');
    }

    const now = new Date();
    const datePart = now.toISOString().slice(0, 10);
    const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const filename = `plan-${datePart}_${timePart}.md`;
    const content = lines.join('\n');

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
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
    @Body() updateDto: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const objectId = new ObjectId(id);
    const phase = await this.phaseRepository.findOne({
      where: { _id: objectId } as any,
    });
    if (!phase) throw new Error('Phase not found');

    if (updateDto.title !== undefined) phase.title = updateDto.title;
    if (updateDto.description !== undefined) phase.description = updateDto.description;

    let existingUrls: string[] = [];
    if (updateDto.existing_images) {
      try {
        existingUrls = JSON.parse(updateDto.existing_images);
      } catch {
        existingUrls = Array.isArray(updateDto.existing_images)
          ? updateDto.existing_images
          : [updateDto.existing_images];
      }
    } else if (updateDto.existing_images === '') {
      existingUrls = [];
    } else {
      existingUrls = (phase.images || []).map((img) => img.url);
    }

    const newUrls = files && files.length > 0
      ? await this.cloudinaryService.uploadFiles(files)
      : [];

    const finalUrls = [...existingUrls, ...newUrls];

    phase.images = finalUrls.map((url) => {
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

  @UseGuards(JwtAuthGuard)
  @Post('import')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async importMarkdown(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No markdown file uploaded');
    }

    const content = file.buffer.toString('utf-8');
    const lines = content.split(/\r?\n/);

    // 1. Clear database completely
    await this.stepRepository.delete({});
    await this.phaseRepository.delete({});

    let currentPhase: Phase | null = null;
    let currentSteps: { title: string; details: { text: string; task_type: string }[]; images: string[] }[] = [];
    let currentStepData: { title: string; details: { text: string; task_type: string }[]; images: string[] } | null = null;

    const saveCurrentSteps = async (phaseId: string) => {
      for (const sData of currentSteps) {
        const step = new Step();
        step.phase_id = phaseId;
        step.title = sData.title;
        step.details = JSON.stringify(sData.details);
        step.done = 0;

        const hasAsset = sData.details.some((d) => d.task_type === 'ASSET');
        const hasCode = sData.details.some((d) => d.task_type === 'CODE');
        if (hasAsset && !hasCode) {
          step.task_type = 'ASSET';
        } else if (hasCode && !hasAsset) {
          step.task_type = 'CODE';
        } else {
          step.task_type = 'NONE';
        }

        step.images = sData.images.map((url) => {
          const img = new StepImage();
          img.url = url;
          return img;
        });

        await this.stepRepository.save(step);
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('## Phase') || (line.startsWith('## ') && !line.includes('Step'))) {
        // Save previous phase steps if any
        if (currentPhase) {
          await saveCurrentSteps(currentPhase._id.toString());
        }

        currentSteps = [];
        currentStepData = null;

        const title = line.replace(/^##\s+/, '').trim();
        let descriptionLines: string[] = [];
        let phaseImages: string[] = [];
        
        let nextIdx = i + 1;
        while (
          nextIdx < lines.length &&
          !lines[nextIdx].trim().startsWith('*') &&
          !lines[nextIdx].trim().startsWith('---') &&
          !lines[nextIdx].trim().startsWith('##')
        ) {
          const descLine = lines[nextIdx].trim();
          if (descLine) {
            if (descLine.startsWith('![](') && descLine.endsWith(')')) {
              const url = descLine.slice(4, -1).trim();
              if (url) phaseImages.push(url);
            } else {
              descriptionLines.push(descLine);
            }
          }
          nextIdx++;
        }
        i = nextIdx - 1;

        const phase = new Phase();
        phase.title = title;
        phase.description = descriptionLines.join('\n');
        phase.done = 0;
        phase.images = phaseImages.map((url) => {
          const img = new PhaseImage();
          img.url = url;
          return img;
        });

        currentPhase = await this.phaseRepository.save(phase);

      } else if (line.startsWith('*') && line.includes('Step')) {
        if (currentStepData) {
          currentSteps.push(currentStepData);
        }

        const cleanTitle = line.replace(/^\*\s+/, '').replace(/\*\*/g, '').trim();
        currentStepData = {
          title: cleanTitle,
          details: [],
          images: [],
        };

      } else if (line.startsWith('*') || line.startsWith('-') || line.startsWith('`*`')) {
        if (currentStepData) {
          const detail = line.replace(/^[\*\-\`\s]+/, '').replace(/\*\*/g, '').trim();
          if (detail) {
            if (detail.startsWith('![](') && detail.endsWith(')')) {
              const url = detail.slice(4, -1).trim();
              if (url) currentStepData.images.push(url);
            } else {
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
      } else if (currentStepData && line && !line.startsWith('---') && !line.startsWith('##')) {
        const detail = line.replace(/^[\*\-\s]+/, '').trim();
        if (detail) {
          if (detail.startsWith('![](') && detail.endsWith(')')) {
            const url = detail.slice(4, -1).trim();
            if (url) currentStepData.images.push(url);
          } else {
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
    }

    if (currentStepData) {
      currentSteps.push(currentStepData);
    }
    if (currentPhase) {
      await saveCurrentSteps(currentPhase._id.toString());
    }

    return { success: true };
  }
}
