import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from 'prom-client';

@Injectable()
export class MonitoringService {
  private readonly registry = new Registry();

  private readonly httpRequests = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code'] as const,
    registers: [this.registry],
  });

  private readonly http5xxErrors = new Counter({
    name: 'http_5xx_errors_total',
    help: 'Total HTTP 5xx responses',
    labelNames: ['method', 'route', 'status_code'] as const,
    registers: [this.registry],
  });

  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [this.registry],
  });

  constructor() {
    this.registry.setDefaultLabels({
      app: 'backend',
      namespace: 'tic-tac-arena',
    });

    collectDefaultMetrics({
      register: this.registry,
      prefix: 'nodejs_',
    });
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  recordHttpRequest(input: {
    method: string;
    route: string;
    statusCode: number;
    durationSeconds: number;
  }) {
    const labels = {
      method: input.method,
      route: input.route,
      status_code: String(input.statusCode),
    };

    this.httpRequests.inc(labels);
    this.httpRequestDuration.observe(labels, input.durationSeconds);

    if (input.statusCode >= 500) {
      this.http5xxErrors.inc(labels);
    }
  }
}
