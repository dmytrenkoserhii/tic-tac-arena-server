import { getSupabaseErrorMessage } from './supabase-error';

describe('getSupabaseErrorMessage', () => {
  it('maps Supabase error codes to user-facing messages', () => {
    expect(
      getSupabaseErrorMessage({
        code: '42501',
        message: 'new row violates row-level security policy',
      }),
    ).toBe('You do not have permission to perform this action.');
  });

  it('maps known RPC errors to product copy', () => {
    expect(
      getSupabaseErrorMessage({
        message: 'Cell is already occupied.',
      }),
    ).toBe('That cell is already taken.');
  });

  it('uses the fallback for unknown errors', () => {
    expect(
      getSupabaseErrorMessage(
        {
          message: 'unexpected database error',
        },
        'Move was not accepted. Try again.',
      ),
    ).toBe('Move was not accepted. Try again.');
  });
});
