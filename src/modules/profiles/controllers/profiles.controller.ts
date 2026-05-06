import { Controller, Post, Req, UseGuards } from '@nestjs/common'

import type { AuthenticatedRequest } from '../../../auth/authenticated-request.type'
import { SupabaseAuthGuard } from '../../../auth/supabase-auth.guard'
import { ProfilesService } from '../services'

@Controller('profiles')
@UseGuards(SupabaseAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post('sync')
  syncProfile(@Req() request: AuthenticatedRequest) {
    return this.profilesService.syncProfile(request.accessToken)
  }
}
