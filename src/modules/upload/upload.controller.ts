import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadSingleFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.uploadService.uploadFile(file, folder);

    return {
      status: 200,
      message: 'File uploaded successfully',
      data: result,
    };
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10, { storage: memoryStorage() }))
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const results = await this.uploadService.uploadMultipleFiles(files, folder);

    return {
      status: 200,
      message: 'Files uploaded successfully',
      data: results,
    };
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const result = await this.uploadService.uploadFile(file, 'images');

    return {
      status: 200,
      message: 'Image uploaded successfully',
      data: result,
    };
  }

  @Delete(':fileName')
  async deleteFile(@Param('fileName') fileName: string) {
    if (!fileName) {
      throw new BadRequestException('File name is required');
    }

    await this.uploadService.deleteFile(fileName);

    return {
      status: 200,
      message: 'File deleted successfully',
    };
  }
}
