import { randomInt } from 'node:crypto'

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { SupabaseService } from '../../../supabase/supabase.service'
import { throwSupabaseBadRequest } from '../../../supabase/supabase-error'
import type { JoinRoomDto } from '../dtos'
import type { Room } from '../types'

const JOIN_ROOM_ERROR =
  'Room was not found, is already full, or you are the host.'
const MAX_CREATE_ATTEMPTS = 5
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ROOM_CODE_LENGTH = 6

@Injectable()
export class RoomsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createRoom(accessToken: string, hostId: string) {
    const supabase = this.supabaseService.createUserClient(accessToken)
    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          code: generateRoomCode(),
          host_id: hostId,
        })
        .select('id, code, host_id, guest_id, status')
        .single<Room>()

      if (!error) {
        return data
      }

      lastError = error

      if (error.code !== '23505') {
        break
      }
    }

    if (lastError) {
      throwSupabaseBadRequest(lastError, 'Room was not created. Try again.')
    }

    throw new BadRequestException('Room was not created. Try again.')
  }

  async joinRoom(
    accessToken: string,
    joinRoomDto: JoinRoomDto,
    guestId: string,
  ) {
    const code = normalizeRoomCode(joinRoomDto.code)

    if (code.length !== ROOM_CODE_LENGTH) {
      throw new BadRequestException('Enter a 6-character room code.')
    }

    const { data, error } = await this.supabaseService
      .createUserClient(accessToken)
      .from('rooms')
      .update({
        guest_id: guestId,
        status: 'ready',
      })
      .eq('code', code)
      .eq('status', 'waiting')
      .is('guest_id', null)
      .select('id, code, host_id, guest_id, status')
      .maybeSingle<Room>()

    if (error) {
      throwSupabaseBadRequest(error, JOIN_ROOM_ERROR)
    }

    if (!data) {
      throw new BadRequestException(JOIN_ROOM_ERROR)
    }

    return data
  }

  async leaveRoom(accessToken: string, roomId: string) {
    if (!roomId) {
      throw new BadRequestException('Room id is required.')
    }

    const { data, error } = await this.supabaseService
      .createUserClient(accessToken)
      .rpc('leave_room', {
        room_id_input: roomId,
      })
      .single<Room>()

    if (error) {
      throwSupabaseBadRequest(error, 'The room was closed.')
    }

    if (!data) {
      throw new InternalServerErrorException('Room was not returned.')
    }

    return data
  }
}

function generateRoomCode() {
  return Array.from({ length: ROOM_CODE_LENGTH }, () => {
    return ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)]
  }).join('')
}

function normalizeRoomCode(code?: string) {
  return code?.trim().toUpperCase() ?? ''
}
