import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

import type { AppConfig } from '../config/app.config'

export type AuthenticatedRequestUser = Pick<User, 'email' | 'id'>

@Injectable()
export class SupabaseService {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  createUserClient(accessToken: string): SupabaseClient {
    return createClient(
      this.configService.get('supabaseUrl', { infer: true }),
      this.configService.get('supabaseAnonKey', { infer: true }),
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      },
    )
  }

  async getUser(accessToken: string) {
    const { data, error } = await this.createUserClient(accessToken).auth.getUser()

    if (error || !data.user) {
      return { error, user: null }
    }

    return {
      error: null,
      user: {
        email: data.user.email,
        id: data.user.id,
      },
    }
  }
}
