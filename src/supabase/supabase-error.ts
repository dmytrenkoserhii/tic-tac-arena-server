import { BadRequestException } from '@nestjs/common'

type SupabaseError = {
  code?: string
  message: string
}

const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  '23503': 'The related record was not found.',
  '23505': 'This record already exists. Try again.',
  '42501': 'You do not have permission to perform this action.',
  PGRST116: 'The requested record was not found.',
}

const KNOWN_RPC_ERROR_MESSAGES: Record<string, string> = {
  'Cell is already occupied.': 'That cell is already taken.',
  'Game is already finished.': 'This game is already finished.',
  'Game was not found.': 'Game was not found.',
  'It is not your turn.': 'It is not your turn.',
  'Only players can make moves.': 'Only players in this room can make moves.',
  'Room was closed.': 'The room was closed.',
  'The room was closed.': 'The room was closed.',
}

export function throwSupabaseBadRequest(
  error: SupabaseError,
  fallbackMessage = 'Action could not be completed. Try again.',
): never {
  throw new BadRequestException(getSupabaseErrorMessage(error, fallbackMessage))
}

export function getSupabaseErrorMessage(
  error: SupabaseError,
  fallbackMessage = 'Action could not be completed. Try again.',
) {
  if (error.code && SUPABASE_ERROR_MESSAGES[error.code]) {
    return SUPABASE_ERROR_MESSAGES[error.code]
  }

  if (KNOWN_RPC_ERROR_MESSAGES[error.message]) {
    return KNOWN_RPC_ERROR_MESSAGES[error.message]
  }

  return fallbackMessage
}
