import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppService } from './app.service';
import type { AuthenticatedRequest } from './auth/authenticated-request.type';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';
import type { AppConfig } from './config/app.config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('ready')
  getReady() {
    return this.appService.getReady();
  }

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

  @Get('debug/sentry')
  testSentry(@Headers('x-sentry-test-token') sentryTestToken?: string) {
    const expectedToken = this.configService.get('sentryTestToken', {
      infer: true,
    });

    if (!expectedToken) {
      throw new NotFoundException();
    }

    if (sentryTestToken !== expectedToken) {
      throw new UnauthorizedException();
    }

    throw new Error('Tic Tac Arena backend Sentry test error');
  }
}
