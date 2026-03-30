import { BadRequestException, Injectable } from '@nestjs/common';
import {
  deleteFromGCS,
  generateUniqueFileName,
  uploadToGCS,
  type UploadResult,
} from '../../utils/google-cloud-storage';

@Injectable()
export class UploadService {
  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.validateFileType(file);

    const uniqueFileName = generateUniqueFileName(file.originalname);

    try {
      return await uploadToGCS(file, uniqueFileName, folder);
    } catch (error) {
      throw new BadRequestException(
        `File upload failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map((file) => this.uploadFile(file, folder));

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw new BadRequestException(
        `Multiple file upload failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      await deleteFromGCS(fileName);
    } catch (error) {
      throw new BadRequestException(
        `File deletion failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private validateFileType(file: Express.Multer.File): void {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size too large. Maximum size is 100MB',
      );
    }
  }
}
