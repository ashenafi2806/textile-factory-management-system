import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.trainingMaterial.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const material = await this.prisma.trainingMaterial.findUnique({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException('Training material not found');
    }

    return {
      ...material,
      downloadUrl: material.fileUrl,
    };
  }
}
