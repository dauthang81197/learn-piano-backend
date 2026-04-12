import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Media, MediaType } from './media.entity';
import { User } from '../users/user.entity';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB

@Injectable()
export class MediaService {
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(
    @InjectRepository(Media) private mediaRepo: Repository<Media>,
    private config: ConfigService,
  ) {
    this.bucket = config.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicUrl = config.getOrThrow<string>('R2_PUBLIC_URL').replace(/\/$/, '');

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${config.getOrThrow<string>('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async upload(file: Express.Multer.File, uploader: User): Promise<Media> {
    const type = this.resolveType(file.mimetype);
    this.validateSize(file, type);

    const ext = extname(file.originalname).toLowerCase();
    const filename = `${randomUUID()}${ext}`;
    const folder = type === MediaType.IMAGE ? 'images' : 'videos';
    const key = `${folder}/${filename}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      }),
    );

    const media = this.mediaRepo.create({
      originalName: file.originalname,
      filename,
      key,
      url: `${this.publicUrl}/${key}`,
      type,
      mimeType: file.mimetype,
      size: file.size,
      uploadedById: uploader.id,
    });

    return this.mediaRepo.save(media);
  }

  findAll(): Promise<Media[]> {
    return this.mediaRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['uploadedBy'],
      select: {
        uploadedBy: { id: true, name: true, email: true },
      },
    });
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.mediaRepo.findOne({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }

  async getStream(id: string): Promise<{ stream: Readable; media: Media }> {
    const media = await this.findOne(id);
    const response = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: media.key }),
    );
    return { stream: response.Body as Readable, media };
  }

  async getPresignedUrl(id: string, expiresIn = 3600): Promise<{ url: string; expiresIn: number }> {
    const media = await this.findOne(id);
    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: media.key }),
      { expiresIn },
    );
    return { url, expiresIn };
  }

  async remove(id: string): Promise<{ message: string }> {
    const media = await this.findOne(id);

    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: media.key }));

    await this.mediaRepo.remove(media);
    return { message: 'Media deleted successfully' };
  }

  private resolveType(mimeType: string): MediaType {
    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return MediaType.IMAGE;
    if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return MediaType.VIDEO;
    throw new BadRequestException(
      `Unsupported file type: ${mimeType}. Allowed: images (jpeg, png, webp, gif) and videos (mp4, webm, mov)`,
    );
  }

  private validateSize(file: Express.Multer.File, type: MediaType): void {
    const limit = type === MediaType.IMAGE ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > limit) {
      const mb = limit / 1024 / 1024;
      throw new BadRequestException(`File quá lớn. Giới hạn: ${mb}MB`);
    }
  }
}
