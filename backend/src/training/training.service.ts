import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTrainingMaterialDto,
  CreateTrainingCourseDto,
  CreateTrainingStepDto,
} from './dto/training.dto';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  private isMissingTableError(
    error: unknown,
    tableNames: string[],
  ): boolean {
    const maybe = error as { code?: string; meta?: { modelName?: string } };
    return (
      maybe?.code === 'P2021' &&
      Boolean(maybe.meta?.modelName) &&
      tableNames.includes(maybe.meta!.modelName!)
    );
  }

  // ==================== Training Materials Methods ====================

  async findAllMaterials() {
    return this.prisma.trainingMaterial.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneMaterial(id: string) {
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

  async createMaterial(createDto: CreateTrainingMaterialDto, file: UploadedFile) {
    console.log('Service - createMaterial called');
  console.log('DTO:', createDto);
  console.log('File:', file);
  
  let fileUrl = createDto.fileUrl;
  
  if (file) {
    fileUrl = `/uploads/training/${file.filename}`;
    console.log('Generated file URL:', fileUrl);
  }
  
  if (!fileUrl) {
    throw new BadRequestException('Either file or fileUrl is required');
  }

    return this.prisma.trainingMaterial.create({
      data: {
        title: createDto.title,
        description: createDto.description,
        fileUrl: fileUrl,
        category: createDto.category,
      },
    });
  }

  async updateMaterial(id: string, updateDto: Partial<CreateTrainingMaterialDto>) {
    const existing = await this.prisma.trainingMaterial.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Training material not found');
    }

    return this.prisma.trainingMaterial.update({
      where: { id },
      data: {
        title: updateDto.title,
        description: updateDto.description,
        category: updateDto.category,
      },
    });
  }

  async deleteMaterial(id: string) {
    const existing = await this.prisma.trainingMaterial.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Training material not found');
    }

    return this.prisma.trainingMaterial.delete({
      where: { id },
    });
  }


  async createCourse(createDto: CreateTrainingCourseDto) {
    return this.prisma.trainingCourse.create({
      data: {
        title: createDto.title,
        description: createDto.description,
        category: createDto.category,
        isRequired: createDto.isRequired || false,
        orderIndex: createDto.orderIndex || 0,
      },
    });
  }

  async findAllCourses() {
    const courses = await this.prisma.trainingCourse.findMany({
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });
    return courses;
  }

  async findCourse(id: string) {
    const course = await this.prisma.trainingCourse.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        enrollments: {
          include: {
            worker: {
              select: {
                id: true,
                employeeId: true,
                fullName: true,
              },
            },
            stepCompletions: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    return course;
  }

  async addStep(courseId: string, stepDto: CreateTrainingStepDto) {
    const course = await this.prisma.trainingCourse.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    const lastStep = await this.prisma.trainingStep.findFirst({
      where: { courseId },
      orderBy: { stepOrder: 'desc' },
    });

    const stepOrder = lastStep ? lastStep.stepOrder + 1 : 1;

    return this.prisma.trainingStep.create({
      data: {
        courseId,
        stepOrder,
        title: stepDto.title,
        description: stepDto.description,
        content: stepDto.content,
        videoUrl: stepDto.videoUrl,
        fileUrl: stepDto.fileUrl,
        requiresConfirmation: stepDto.requiresConfirmation || false,
      },
    });
  }

  async updateStep(courseId: string, stepId: string, updateDto: Partial<CreateTrainingStepDto>) {
    const step = await this.prisma.trainingStep.findFirst({
      where: {
        id: stepId,
        courseId,
      },
    });

    if (!step) {
      throw new NotFoundException('Training step not found');
    }

    return this.prisma.trainingStep.update({
      where: { id: stepId },
      data: {
        title: updateDto.title,
        description: updateDto.description,
        content: updateDto.content,
        videoUrl: updateDto.videoUrl,
        fileUrl: updateDto.fileUrl,
        requiresConfirmation: updateDto.requiresConfirmation,
      },
    });
  }

  async deleteStep(courseId: string, stepId: string) {
    const step = await this.prisma.trainingStep.findFirst({
      where: {
        id: stepId,
        courseId,
      },
    });

    if (!step) {
      throw new NotFoundException('Training step not found');
    }

    return this.prisma.trainingStep.delete({
      where: { id: stepId },
    });
  }

  async updateCourse(id: string, updateDto: Partial<CreateTrainingCourseDto>) {
    const course = await this.prisma.trainingCourse.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    return this.prisma.trainingCourse.update({
      where: { id },
      data: {
        title: updateDto.title,
        description: updateDto.description,
        category: updateDto.category,
        isRequired: updateDto.isRequired,
        orderIndex: updateDto.orderIndex,
      },
    });
  }

  async deleteCourse(id: string) {
    const course = await this.prisma.trainingCourse.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    return this.prisma.trainingCourse.delete({
      where: { id },
    });
  }

  // ==================== Employee Progress Tracking Methods ====================

  async getWorkerProfileByUserId(userId: string) {
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!workerProfile) {
      throw new NotFoundException('Worker profile not found for this user');
    }

    return workerProfile;
  }

  async getCourseForLearner(courseId: string, userId: string) {
    const worker = await this.getWorkerProfileByUserId(userId);
    const course = await this.prisma.trainingCourse.findUnique({
      where: { id: courseId },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
      },
    });
    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    const enrollment = await this.prisma.trainingEnrollment.findUnique({
      where: {
        workerId_courseId: { workerId: worker.id, courseId },
      },
      include: { stepCompletions: true },
    });

    const completedIds = new Set(
      enrollment?.stepCompletions.map((c) => c.stepId) ?? [],
    );
    const steps = course.steps.map((step) => ({
      ...step,
      isCompleted: completedIds.has(step.id),
    }));

    return {
      course: { ...course, steps },
      enrollment,
      workerId: worker.id,
    };
  }

  async enrollCurrentUser(userId: string, courseId: string) {
    const worker = await this.getWorkerProfileByUserId(userId);
    const enrollment = await this.enrollInCourse(worker.id, courseId);
    if (enrollment.status === 'NOT_STARTED') {
      return this.prisma.trainingEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'IN_PROGRESS' },
        include: {
          course: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
          stepCompletions: true,
        },
      });
    }
    return enrollment;
  }

  async enrollInCourse(workerId: string, courseId: string) {
    const course = await this.prisma.trainingCourse.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    const worker = await this.prisma.workerProfile.findUnique({
      where: { id: workerId },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    const existing = await this.prisma.trainingEnrollment.findUnique({
      where: {
        workerId_courseId: { workerId, courseId },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.trainingEnrollment.create({
      data: {
        workerId,
        courseId,
        status: 'NOT_STARTED',
        progress: 0,
        currentStepIndex: 0,
      },
      include: {
        course: {
          include: {
            steps: true,
          },
        },
      },
    });
  }

  async completeStep(enrollmentId: string, stepId: string, userId?: string) {
    const enrollment = await this.prisma.trainingEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { worker: true },
    });
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }
    if (userId) {
      const worker = await this.getWorkerProfileByUserId(userId);
      if (enrollment.workerId !== worker.id) {
        throw new BadRequestException('Not your enrollment');
      }
    }

    const existingCompletion = await this.prisma.trainingStepCompletion.findUnique({
      where: {
        enrollmentId_stepId: { enrollmentId, stepId },
      },
    });

    if (existingCompletion) {
      return existingCompletion;
    }

    await this.prisma.trainingStepCompletion.create({
      data: {
        enrollmentId,
        stepId,
      },
    });

    const enrollmentWithSteps = await this.prisma.trainingEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' },
            },
          },
        },
        stepCompletions: true,
      },
    });

    if (!enrollmentWithSteps) {
      throw new NotFoundException('Enrollment not found');
    }

    const totalSteps = enrollmentWithSteps.course.steps.length;
    const completedSteps = enrollmentWithSteps.stepCompletions.length;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 100;
    const status = progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS';

    return this.prisma.trainingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        progress,
        status,
        completedAt: progress >= 100 ? new Date() : null,
        currentStepIndex: completedSteps,
      },
      include: {
        course: true,
        stepCompletions: true,
      },
    });
  }

  async getWorkerProgress(workerId: string) {
    try {
      const enrollments = await this.prisma.trainingEnrollment.findMany({
        where: { workerId },
        include: {
          course: {
            include: {
              steps: {
                orderBy: { stepOrder: 'asc' },
              },
            },
          },
          stepCompletions: {
            include: {
              step: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
      }); // Type assertion to bypass strict typing

      return enrollments.map((enrollment) => {
        const totalSteps = enrollment.course.steps.length;
        const completedStepIds = enrollment.stepCompletions.map((sc: any) => sc.stepId);
        const steps = enrollment.course.steps.map((step: any) => ({
          ...step,
          isCompleted: completedStepIds.includes(step.id),
        }));

        return {
          ...enrollment,
          course: {
            ...enrollment.course,
            steps,
          },
          completionPercentage: enrollment.progress,
          totalSteps,
          completedSteps: enrollment.stepCompletions.length,
        };
      });
    } catch (error) {
      if (this.isMissingTableError(error, ['TrainingEnrollment'])) {
        return [];
      }
      throw error;
    }
  }

  async getCompletionReport() {
    try {
      const totalWorkers = await this.prisma.workerProfile.count();
      const totalCourses = await this.prisma.trainingCourse.count();

    const enrollments = await this.prisma.trainingEnrollment.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const courseStats = await this.prisma.trainingCourse.findMany({
      include: {
        enrollments: {
          include: {
            stepCompletions: true,
          },
        },
        steps: true,
      },
    });

    const courseCompletionData = courseStats.map((course) => {
      const totalEnrollments = course.enrollments.length;
      const completedEnrollments = course.enrollments.filter((e) => e.status === 'COMPLETED').length;
      const averageProgress = totalEnrollments > 0
        ? course.enrollments.reduce((sum, e) => sum + e.progress, 0) / totalEnrollments
        : 0;

      return {
        courseId: course.id,
        courseTitle: course.title,
        totalEnrollments,
        completedEnrollments,
        completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
        averageProgress,
        totalSteps: course.steps.length,
      };
    });

    const totalEnrollments = await this.prisma.trainingEnrollment.count();
    const completedCourses = enrollments.find((e) => e.status === 'COMPLETED')?._count?.status || 0;
    const inProgressCourses = enrollments.find((e) => e.status === 'IN_PROGRESS')?._count?.status || 0;
    const notStartedCourses = enrollments.find((e) => e.status === 'NOT_STARTED')?._count?.status || 0;

      return {
        summary: {
          totalWorkers,
          totalCourses,
          totalEnrollments,
          completedCourses,
          inProgressCourses,
          notStartedCourses,
        },
        courseCompletion: courseCompletionData,
        generatedAt: new Date(),
      };
    } catch (error) {
      if (
        this.isMissingTableError(error, [
          'TrainingEnrollment',
          'TrainingCourse',
          'WorkerProfile',
        ])
      ) {
        return {
          summary: {
            totalWorkers: 0,
            totalCourses: 0,
            totalEnrollments: 0,
            completedCourses: 0,
            inProgressCourses: 0,
            notStartedCourses: 0,
          },
          courseCompletion: [],
          generatedAt: new Date(),
        };
      }
      throw error;
    }
  }

  async getCourseCompletionReport(courseId: string) {
    const course = await this.prisma.trainingCourse.findUnique({
      where: { id: courseId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        enrollments: {
          include: {
            worker: {
              select: {
                id: true,
                employeeId: true,
                fullName: true,
                department: true,
              },
            },
            stepCompletions: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    const enrollmentDetails = course.enrollments.map((enrollment) => ({
      workerId: enrollment.worker.id,
      employeeId: enrollment.worker.employeeId,
      workerName: enrollment.worker.fullName,
      department: enrollment.worker.department,
      status: enrollment.status,
      progress: enrollment.progress,
      startedAt: enrollment.startedAt,
      completedAt: enrollment.completedAt,
      completedSteps: enrollment.stepCompletions.length,
      totalSteps: course.steps.length,
      stepDetails: course.steps.map((step) => ({
        stepTitle: step.title,
        isCompleted: enrollment.stepCompletions.some((sc) => sc.stepId === step.id),
        completedAt: enrollment.stepCompletions.find((sc) => sc.stepId === step.id)?.completedAt,
      })),
    }));

    const totalEnrollments = course.enrollments.length;
    const completedCount = course.enrollments.filter((e) => e.status === 'COMPLETED').length;
    const inProgressCount = course.enrollments.filter((e) => e.status === 'IN_PROGRESS').length;
    const notStartedCount = course.enrollments.filter((e) => e.status === 'NOT_STARTED').length;
    const averageProgress = totalEnrollments > 0
      ? course.enrollments.reduce((sum, e) => sum + e.progress, 0) / totalEnrollments
      : 0;

    return {
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        isRequired: course.isRequired,
        totalSteps: course.steps.length,
        steps: course.steps,
      },
      enrollments: enrollmentDetails,
      summary: {
        totalEnrollments,
        completedCount,
        inProgressCount,
        notStartedCount,
        averageProgress,
      },
    };
  }

  async getTrainingDashboardSummary() {
    const recentMaterials = await this.prisma.trainingMaterial.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    const recentCourses = await this.prisma.trainingCourse.findMany({
      take: 5,
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const topPerformers = await this.prisma.trainingEnrollment.groupBy({
      by: ['workerId'],
      where: {
        status: 'COMPLETED',
      },
      _count: {
        workerId: true,
      },
      orderBy: {
        _count: {
          workerId: 'desc',
        },
      },
      take: 10,
    });

    const workerDetails = await Promise.all(
      topPerformers.map(async (performer) => {
        const worker = await this.prisma.workerProfile.findUnique({
          where: { id: performer.workerId },
          select: {
            id: true,
            employeeId: true,
            fullName: true,
            department: true,
          },
        });
        return {
          ...worker,
          completedCoursesCount: performer._count.workerId,
        };
      }),
    );

    return {
      recentMaterials,
      recentCourses,
      topPerformers: workerDetails,
      generatedAt: new Date(),
    };
  }
}