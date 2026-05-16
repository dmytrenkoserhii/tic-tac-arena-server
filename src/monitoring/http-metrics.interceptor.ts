import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { finalize, type Observable } from 'rxjs';

import { MonitoringService } from './monitoring.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = process.hrtime.bigint();

    return next.handle().pipe(
      finalize(() => {
        const durationSeconds =
          Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;

        this.monitoringService.recordHttpRequest({
          method: request.method,
          route: this.getRouteLabel(request),
          statusCode: response.statusCode,
          durationSeconds,
        });
      }),
    );
  }

  private getRouteLabel(request: Request) {
    const route = request.route as { path?: unknown } | undefined;

    if (typeof route?.path === 'string') {
      return route.path;
    }

    return request.path;
  }
}
