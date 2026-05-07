import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';

import type { AuthenticatedRequest } from '../../../auth/authenticated-request.type';
import { SupabaseAuthGuard } from '../../../auth/supabase-auth.guard';
import type { JoinRoomDto } from '../dtos';
import { RoomsService } from '../services';

@Controller('rooms')
@UseGuards(SupabaseAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  createRoom(@Req() request: AuthenticatedRequest) {
    return this.roomsService.createRoom(request.accessToken, request.user.id);
  }

  @Post('join')
  joinRoom(
    @Body() joinRoomDto: JoinRoomDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.roomsService.joinRoom(
      request.accessToken,
      joinRoomDto,
      request.user.id,
    );
  }

  @Post(':roomId/leave')
  leaveRoom(
    @Param('roomId') roomId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.roomsService.leaveRoom(request.accessToken, roomId);
  }
}
