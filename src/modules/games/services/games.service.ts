import { BadRequestException, Injectable } from '@nestjs/common'

import { SupabaseService } from '../../../supabase/supabase.service'
import type { CreateGameDto, CreateMoveDto } from '../dtos'
import type { Game, Move } from '../types'
import type { Room } from '../../rooms/types'

@Injectable()
export class GamesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createGame(
    accessToken: string,
    createGameDto: CreateGameDto,
    userId: string,
  ) {
    if (!createGameDto.roomId) {
      throw new BadRequestException('Room id is required.')
    }

    const supabase = this.supabaseService.createUserClient(accessToken)
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, code, host_id, guest_id, status')
      .eq('id', createGameDto.roomId)
      .single<Room>()

    if (roomError) {
      throw new BadRequestException(roomError.message)
    }

    if (room.host_id !== userId) {
      throw new BadRequestException('Only the host can start a game.')
    }

    if (room.status !== 'ready' || !room.guest_id) {
      throw new BadRequestException(
        'The second player must join before starting a game.',
      )
    }

    const { data: activeGame, error: activeGameError } = await supabase
      .from('games')
      .select('id, room_id, x_player_id, o_player_id, status, winner_id')
      .eq('room_id', room.id)
      .eq('status', 'in_progress')
      .maybeSingle<Game>()

    if (activeGameError) {
      throw new BadRequestException(activeGameError.message)
    }

    if (activeGame) {
      return activeGame
    }

    const { data, error } = await supabase
      .from('games')
      .insert({
        o_player_id: room.guest_id,
        room_id: room.id,
        x_player_id: room.host_id,
      })
      .select('id, room_id, x_player_id, o_player_id, status, winner_id')
      .single<Game>()

    if (error) {
      throw new BadRequestException(error.message)
    }

    return data
  }

  async createMove(
    accessToken: string,
    gameId: string,
    createMoveDto: CreateMoveDto,
  ) {
    if (!gameId) {
      throw new BadRequestException('Game id is required.')
    }

    if (
      typeof createMoveDto.cellIndex !== 'number' ||
      !Number.isInteger(createMoveDto.cellIndex)
    ) {
      throw new BadRequestException('Cell index is required.')
    }

    const { data, error } = await this.supabaseService
      .createUserClient(accessToken)
      .rpc('make_move', {
        cell_index_input: createMoveDto.cellIndex,
        game_id_input: gameId,
      })
      .single<Move>()

    if (error) {
      throw new BadRequestException(error.message)
    }

    return data
  }
}
