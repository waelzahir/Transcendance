import { Controller, Get } from '@nestjs/common';
import { VidchatService } from './vidchat.service';
import { GetCurrentUserId, Public } from 'src/common/decorators';

@Controller('vidchat')
export class VidchatController {
  constructor(private readonly vidchatService: VidchatService) {}

  @Get("")
  @Public()
  async getOnline(@GetCurrentUserId() id: number)
  {
      return await this.vidchatService.getOnline(id);
  }
}
