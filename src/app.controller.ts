import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { AppService } from './app.service';
import type { AuthenticatedRequest } from './auth/authenticated-request.type';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  getMe(@Req() request: AuthenticatedRequest) {
    return {
      email: request.user.email,
      id: request.user.id,
    };
  }
}
