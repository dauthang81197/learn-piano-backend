import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './media.entity';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { AdminMediaController } from './admin-media.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Media])],
  providers: [MediaService],
  controllers: [MediaController, AdminMediaController],
  exports: [MediaService],
})
export class MediaModule {}
