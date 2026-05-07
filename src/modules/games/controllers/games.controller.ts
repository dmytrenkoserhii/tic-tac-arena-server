import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';

import type { AuthenticatedRequest } from '../../../auth/authenticated-request.type';
import { SupabaseAuthGuard } from '../../../auth/supabase-auth.guard';
import type { CreateGameDto, CreateMoveDto } from '../dtos';
import { GamesService } from '../services';

@Controller('games')
@UseGuards(SupabaseAuthGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  createGame(
    @Body() createGameDto: CreateGameDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.gamesService.createGame(
      request.accessToken,
      createGameDto,
      request.user.id,
    );
  }

  @Post(':gameId/moves')
  createMove(
    @Body() createMoveDto: CreateMoveDto,
    @Param('gameId') gameId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.gamesService.createMove(
      request.accessToken,
      gameId,
      createMoveDto,
    );
  }
}
