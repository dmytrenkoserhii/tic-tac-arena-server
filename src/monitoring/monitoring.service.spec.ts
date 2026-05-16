import { MonitoringService } from './monitoring.service';

describe('MonitoringService', () => {
  it('exposes Prometheus metrics text', async () => {
    const service = new MonitoringService();

    const metrics = await service.getMetrics();

    expect(metrics).toContain('nodejs_process_cpu_user_seconds_total');
  });

  it('records HTTP request counters and duration buckets', async () => {
    const service = new MonitoringService();

    service.recordHttpRequest({
      durationSeconds: 0.03,
      method: 'POST',
      route: '/rooms',
      statusCode: 201,
    });

    const metrics = await service.getMetrics();

    expect(metrics).toMatch(
      /http_requests_total\{[^}]*method="POST"[^}]*route="\/rooms"[^}]*status_code="201"[^}]*\} 1/,
    );
    expect(metrics).toContain('http_request_duration_seconds_bucket');
  });
});
