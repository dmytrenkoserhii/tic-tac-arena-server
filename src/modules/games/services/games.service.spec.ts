import { SupabaseService } from '../../../supabase/supabase.service';
import type { Game, Move } from '../types';
import type { Room } from '../../rooms/types';
import { GamesService } from './games.service';

const readyRoom: Room = {
  code: 'ABC123',
  guest_id: 'guest-id',
  host_id: 'host-id',
  id: 'room-id',
  status: 'ready',
};

describe('GamesService', () => {
  it('rejects game starts from non-host players', async () => {
    const roomQuery = createSupabaseQuery<Room>({
      data: readyRoom,
      error: null,
    });
    const from = jest.fn().mockReturnValue(roomQuery);
    const service = new GamesService({
      createUserClient: jest.fn().mockReturnValue({ from }),
    } as unknown as SupabaseService);

    await expect(
      service.createGame('access-token', { roomId: readyRoom.id }, 'guest-id'),
    ).rejects.toThrow('Only the host can start a game.');
    expect(from).toHaveBeenCalledTimes(1);
  });

  it('returns the active game instead of creating a duplicate', async () => {
    const activeGame: Game = {
      id: 'game-id',
      o_player_id: 'guest-id',
      room_id: readyRoom.id,
      status: 'in_progress',
      winner_id: null,
      x_player_id: 'host-id',
    };
    const roomQuery = createSupabaseQuery<Room>({
      data: readyRoom,
      error: null,
    });
    const activeGameQuery = createSupabaseQuery<Game>({
      data: activeGame,
      error: null,
    });
    const from = jest.fn((table: string) => {
      return table === 'rooms' ? roomQuery : activeGameQuery;
    });
    const service = new GamesService({
      createUserClient: jest.fn().mockReturnValue({ from }),
    } as unknown as SupabaseService);

    await expect(
      service.createGame('access-token', { roomId: readyRoom.id }, 'host-id'),
    ).resolves.toBe(activeGame);
    expect(activeGameQuery.insert).not.toHaveBeenCalled();
  });

  it('rejects moves without a valid cell index', async () => {
    const createUserClient = jest.fn();
    const service = new GamesService({
      createUserClient,
    } as unknown as SupabaseService);

    await expect(
      service.createMove('access-token', 'game-id', {}),
    ).rejects.toThrow('Cell index is required.');
    expect(createUserClient).not.toHaveBeenCalled();
  });

  it('maps known move RPC errors to friendly messages', async () => {
    const moveQuery = createSupabaseQuery<Move>({
      data: null,
      error: new Error('Cell is already occupied.'),
    });
    const service = new GamesService({
      createUserClient: jest.fn().mockReturnValue({
        rpc: jest.fn().mockReturnValue(moveQuery),
      }),
    } as unknown as SupabaseService);

    await expect(
      service.createMove('access-token', 'game-id', { cellIndex: 0 }),
    ).rejects.toThrow('That cell is already taken.');
  });
});

type QueryResult<TData> = {
  data: TData | null;
  error: Error | null;
};

type SupabaseQueryMock<TData> = {
  eq: jest.Mock<SupabaseQueryMock<TData>, unknown[]>;
  insert: jest.Mock<SupabaseQueryMock<TData>, unknown[]>;
  maybeSingle: jest.Mock<Promise<QueryResult<TData>>, unknown[]>;
  select: jest.Mock<SupabaseQueryMock<TData>, unknown[]>;
  single: jest.Mock<Promise<QueryResult<TData>>, unknown[]>;
};

function createSupabaseQuery<TData>(
  result: QueryResult<TData>,
): SupabaseQueryMock<TData> {
  const query = {} as SupabaseQueryMock<TData>;

  query.eq = jest.fn((): SupabaseQueryMock<TData> => query);
  query.insert = jest.fn((): SupabaseQueryMock<TData> => query);
  query.maybeSingle = jest.fn(() => Promise.resolve(result));
  query.select = jest.fn((): SupabaseQueryMock<TData> => query);
  query.single = jest.fn(() => Promise.resolve(result));

  return query;
}
