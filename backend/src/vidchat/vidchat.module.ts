import { Module } from '@nestjs/common';
import { VidchatService } from './vidchat.service';
import { VidchatController } from './vidchat.controller';
import { VidchatGateway } from './vidchat.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [VidchatController],
  imports: [PrismaModule],
  providers: [VidchatService, VidchatGateway],
})
export class VidchatModule {}
