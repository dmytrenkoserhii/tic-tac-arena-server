import type { Request } from 'express'

import type { AuthenticatedRequestUser } from '../supabase/supabase.service'

export type AuthenticatedRequest = Request & {
  accessToken: string
  user: AuthenticatedRequestUser
}
