import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { TrainingService } from './training.service';
import {
  CreateTrainingMaterialDto,
  CreateTrainingCourseDto,
  CreateTrainingStepDto,
} from './dto/training.dto';

@ApiTags('training')
@ApiBearerAuth('jwt')
@Controller('training')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  // ==================== Training Materials CRUD ====================

  @ApiOperation({ summary: 'List all training materials' })
  @ApiResponse({ status: 200, description: 'Array of materials' })
  @Get('materials')
  @Roles(
    'WORKER',
    'SUPERVISOR',
    'MANAGER',
    'HR_ADMIN',
    'STOREKEEPER',
    'PRODUCTION_MANAGER',
    'PRODUCTION_SUPERVISOR',
    'MAINTENANCE_MANAGER',
    'MAINTENANCE_TECHNICIAN',
    'QA_MANAGER',
    'QA_STAFF',
    'ADMIN',
  )
  findAllMaterials() {
    return this.trainingService.findAllMaterials();
  }

  @ApiOperation({ summary: 'Get a training material by ID' })
  @ApiParam({ name: 'id', description: 'Training material ID' })
  @ApiResponse({ status: 200, description: 'Material found' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  @Get('materials/:id')
  @Roles(
    'WORKER',
    'SUPERVISOR',
    'MANAGER',
    'HR_ADMIN',
    'STOREKEEPER',
    'PRODUCTION_MANAGER',
    'PRODUCTION_SUPERVISOR',
    'MAINTENANCE_MANAGER',
    'MAINTENANCE_TECHNICIAN',
    'QA_MANAGER',
    'QA_STAFF',
    'ADMIN',
  )
  findOneMaterial(@Param('id') id: string) {
    return this.trainingService.findOneMaterial(id);
  }

  @ApiOperation({ summary: 'Create a new training material' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateTrainingMaterialDto })
  @Post('materials')
  @Roles('HR_ADMIN', 'ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async createMaterial(
    @Body() createTrainingMaterialDto: CreateTrainingMaterialDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
     console.log('=== Debug Info ===');
  console.log('File received:', file);
  console.log('Body received:', createTrainingMaterialDto);
  console.log('==================');
  if (file) {
      const fileUrl = `/uploads/training/${file.filename}`;
      return this.trainingService.createMaterial(
        { ...createTrainingMaterialDto, fileUrl },
        file
      );
    }
    return this.trainingService.createMaterial(createTrainingMaterialDto, file);
  }

  @ApiOperation({ summary: 'Update a training material' })
  @ApiParam({ name: 'id', description: 'Training material ID' })
  @Put('materials/:id')
  @Roles('HR_ADMIN', 'ADMIN')
  async updateMaterial(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateTrainingMaterialDto>,
  ) {
    return this.trainingService.updateMaterial(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete a training material' })
  @ApiParam({ name: 'id', description: 'Training material ID' })
  @Delete('materials/:id')
  @Roles('HR_ADMIN', 'ADMIN')
  async deleteMaterial(@Param('id') id: string) {
    return this.trainingService.deleteMaterial(id);
  }

  // ==================== Course Management (Step-by-Step Guidance) ====================

  @ApiOperation({ summary: 'Create a new training course' })
  @Post('courses')
  @Roles('SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN')
  async createCourse(@Body() createCourseDto: CreateTrainingCourseDto) {
    return this.trainingService.createCourse(createCourseDto);
  }

  @ApiOperation({ summary: 'List all training courses' })
  @Get('courses')
  @Roles(
    'WORKER',
    'SUPERVISOR',
    'MANAGER',
    'HR_ADMIN',
    'ADMIN',
    'PRODUCTION_MANAGER',
  )
  async findAllCourses() {
    return this.trainingService.findAllCourses();
  }

  @ApiOperation({ summary: 'Get a training course by ID with all steps' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @Get('courses/:id')
  @Roles(
    'WORKER',
    'SUPERVISOR',
    'MANAGER',
    'HR_ADMIN',
    'ADMIN',
    'PRODUCTION_MANAGER',
  )
  async findCourse(@Param('id') id: string) {
    return this.trainingService.findCourse(id);
  }

  @ApiOperation({ summary: 'Add a step to a training course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @Post('courses/:id/steps')
  @Roles('HR_ADMIN', 'ADMIN')
  async addStep(
    @Param('id') courseId: string,
    @Body() stepDto: CreateTrainingStepDto,
  ) {
    return this.trainingService.addStep(courseId, stepDto);
  }

  @ApiOperation({ summary: 'Update a step in a training course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'stepId', description: 'Step ID' })
  @Put('courses/:courseId/steps/:stepId')
  @Roles('HR_ADMIN', 'ADMIN')
  async updateStep(
    @Param('courseId') courseId: string,
    @Param('stepId') stepId: string,
    @Body() updateDto: Partial<CreateTrainingStepDto>,
  ) {
    return this.trainingService.updateStep(courseId, stepId, updateDto);
  }

  @ApiOperation({ summary: 'Delete a step from a training course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'stepId', description: 'Step ID' })
  @Delete('courses/:courseId/steps/:stepId')
  @Roles('HR_ADMIN', 'ADMIN')
  async deleteStep(
    @Param('courseId') courseId: string,
    @Param('stepId') stepId: string,
  ) {
    return this.trainingService.deleteStep(courseId, stepId);
  }

  @ApiOperation({ summary: 'Update a training course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @Put('courses/:id')
  @Roles('HR_ADMIN', 'ADMIN')
  async updateCourse(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateTrainingCourseDto>,
  ) {
    return this.trainingService.updateCourse(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete a training course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @Delete('courses/:id')
  @Roles('HR_ADMIN', 'ADMIN')
  async deleteCourse(@Param('id') id: string) {
    return this.trainingService.deleteCourse(id);
  }

  // ==================== Employee Progress Tracking ====================

  @ApiOperation({ summary: 'Enroll a worker in a training course' })
  @Post('enroll')
  @Roles('WORKER', 'SUPERVISOR', 'HR_ADMIN', 'ADMIN')
  async enrollInCourse(
    @Body() enrollDto: { workerId: string; courseId: string },
  ) {
    return this.trainingService.enrollInCourse(
      enrollDto.workerId,
      enrollDto.courseId,
    );
  }

  @ApiOperation({ summary: 'Complete a step in a training course' })
  @Post('complete-step')
  @Roles('WORKER')
  async completeStep(
    @Body() completeDto: { enrollmentId: string; stepId: string },
  ) {
    return this.trainingService.completeStep(
      completeDto.enrollmentId,
      completeDto.stepId,
    );
  }

  @ApiOperation({ summary: 'Get current user\'s training progress' })
  @Get('my-training')
  @Roles('WORKER')
  async getMyTrainingProgress(@Req() req) {
    try {
      const workerProfile = await this.trainingService.getWorkerProfileByUserId(
        req.user.id,
      );
      return this.trainingService.getWorkerProgress(workerProfile.id);
    } catch (error) {
      const maybe = error as { code?: string; status?: number };
      // During local bootstrap/migration gaps, return an empty progress list
      // instead of surfacing 500 from missing Prisma tables/profile records.
      if (maybe?.code === 'P2021' || maybe?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  @ApiOperation({ summary: 'Get training progress for a specific worker' })
  @ApiParam({ name: 'workerId', description: 'Worker Profile ID' })
  @Get('workers/:workerId/training')
  @Roles('HR_ADMIN', 'MANAGER', 'SUPERVISOR', 'ADMIN')
  async getWorkerTraining(@Param('workerId') workerId: string) {
    return this.trainingService.getWorkerProgress(workerId);
  }

  @ApiOperation({ summary: 'Get training completion report' })
  @Get('reports/completion')
  @Roles('WORKER', 'HR_ADMIN', 'MANAGER', 'ADMIN')
  async getTrainingCompletionReport() {
    return this.trainingService.getCompletionReport();
  }

  @ApiOperation({ summary: 'Get detailed report for a specific course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @Get('reports/courses/:courseId')
  @Roles('HR_ADMIN', 'MANAGER', 'ADMIN')
  async getCourseCompletionReport(@Param('courseId') courseId: string) {
    return this.trainingService.getCourseCompletionReport(courseId);
  }

  @ApiOperation({ summary: 'Get worker training summary for dashboard' })
  @Get('dashboard/summary')
  @Roles('WORKER', 'HR_ADMIN', 'MANAGER', 'ADMIN')
  async getTrainingDashboardSummary() {
    return this.trainingService.getTrainingDashboardSummary();
  }
}