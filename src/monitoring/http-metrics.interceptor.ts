import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { finalize, type Observable } from 'rxjs';

import { MonitoringService } from './monitoring.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpMetricsInterceptor.name);

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

        const route = this.getRouteLabel(request);

        this.monitoringService.recordHttpRequest({
          method: request.method,
          route,
          statusCode: response.statusCode,
          durationSeconds,
        });

        this.logHttpRequest({
          method: request.method,
          route,
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

  private logHttpRequest(requestLog: {
    method: string;
    route: string;
    statusCode: number;
    durationSeconds: number;
  }) {
    if (this.isNoisyMonitoringRoute(requestLog.route)) {
      return;
    }

    const message = JSON.stringify({
      event: 'http_request',
      method: requestLog.method,
      route: requestLog.route,
      statusCode: requestLog.statusCode,
      durationMs: Math.round(requestLog.durationSeconds * 1000),
    });

    if (requestLog.statusCode >= 500) {
      this.logger.error(message);
      return;
    }

    if (requestLog.statusCode >= 400) {
      this.logger.warn(message);
      return;
    }

    this.logger.log(message);
  }

  private isNoisyMonitoringRoute(route: string) {
    return route === '/health' || route === '/ready' || route === '/metrics';
  }
}
