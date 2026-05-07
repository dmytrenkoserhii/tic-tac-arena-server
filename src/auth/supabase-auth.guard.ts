import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { SupabaseService } from '../supabase/supabase.service';
import type { AuthenticatedRequest } from './authenticated-request.type';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = getBearerToken(request.headers.authorization);

    if (!accessToken) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const { error, user } = await this.supabaseService.getUser(accessToken);

    if (error || !user) {
      throw new UnauthorizedException('Invalid bearer token.');
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.accessToken = accessToken;
    authenticatedRequest.user = user;

    return true;
  }
}

function getBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}
