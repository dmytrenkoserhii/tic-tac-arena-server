import { SupabaseService } from '../../../supabase/supabase.service'
import { RoomsService } from './rooms.service'

describe('RoomsService', () => {
  it('rejects room codes that are not 6 characters', async () => {
    const createUserClient = jest.fn()
    const service = new RoomsService({
      createUserClient,
    } as unknown as SupabaseService)

    await expect(
      service.joinRoom('access-token', { code: 'ABC' }, 'guest-id'),
    ).rejects.toThrow('Enter a 6-character room code.')
    expect(createUserClient).not.toHaveBeenCalled()
  })

  it('rejects joins when the room is unavailable', async () => {
    const roomQuery = createSupabaseQuery({
      data: null,
      error: null,
    })
    const createUserClient = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue(roomQuery),
    })
    const service = new RoomsService({
      createUserClient,
    } as unknown as SupabaseService)

    await expect(
      service.joinRoom('access-token', { code: 'ABC123' }, 'guest-id'),
    ).rejects.toThrow(
      'Room was not found, is already full, or you are the host.',
    )
  })
})

type QueryResult<TData> = {
  data: TData | null
  error: Error | null
}

function createSupabaseQuery<TData>(result: QueryResult<TData>) {
  const query = {
    eq: jest.fn(() => query),
    is: jest.fn(() => query),
    maybeSingle: jest.fn(async () => result),
    select: jest.fn(() => query),
    update: jest.fn(() => query),
  }

  return query
}
