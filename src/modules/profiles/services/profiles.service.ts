import { BadRequestException, Injectable } from '@nestjs/common'
import type { User } from '@supabase/supabase-js'

import { SupabaseService } from '../../../supabase/supabase.service'
import type { Profile } from '../types'

@Injectable()
export class ProfilesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async syncProfile(accessToken: string) {
    const supabase = this.supabaseService.createUserClient(accessToken)
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      throw new BadRequestException(userError?.message ?? 'User was not found.')
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          avatar_url: getStringMetadata(userData.user, 'avatar_url'),
          display_name:
            getStringMetadata(userData.user, 'full_name') ??
            getStringMetadata(userData.user, 'name'),
          email: userData.user.email ?? null,
          id: userData.user.id,
        },
        { onConflict: 'id' },
      )
      .select('id, email, display_name, avatar_url')
      .single<Profile>()

    if (error) {
      throw new BadRequestException(error.message)
    }

    return data
  }
}

function getStringMetadata(user: User, key: string) {
  const value = user.user_metadata[key]

  return typeof value === 'string' ? value : null
}
