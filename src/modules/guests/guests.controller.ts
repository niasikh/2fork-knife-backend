import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('guests')
@UseGuards(JwtAuthGuard)
export class GuestsController {
  constructor(private guestsService: GuestsService) {}

  @Get()
  async findAll() {
    return this.guestsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }

  @Post(':id/notes')
  async addNote(
    @Param('id') id: string,
    @Body() body: { content: string; isInternal?: boolean },
    @CurrentUser() user: { id: string },
  ) {
    return this.guestsService.addNote(id, body.content, user.id, body.isInternal);
  }

  @Put(':id/tags')
  async updateTags(@Param('id') id: string, @Body() body: { tags: string[] }) {
    return this.guestsService.updateTags(id, body.tags);
  }
}
