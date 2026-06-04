/**
 * E2E tests for HTTP controllers.
 *
 * These tests replace the AppModule with a controlled testing module that uses
 * mock implementations of all use cases. This avoids database and filesystem
 * dependencies while exercising the full HTTP layer including routing,
 * decorators, serialization, and response headers.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ReaderController } from 'src/infrastructure/inbound/http/reader.controller';
import { ReportsController } from 'src/infrastructure/inbound/http/reports.controller';
import { ProcessLogFileUseCase } from 'src/application/use-cases/ProcessLogFileUseCase';
import { CreateConsumerReportUseCase } from 'src/application/use-cases/CreateConsumerReportUseCase';
import { CreateServiceReportUseCase } from 'src/application/use-cases/CreateServiceReportUseCase';
import { CreateAvgLatencyReportUseCase } from 'src/application/use-cases/CreateAvgLatencyReportUseCase';

// ---------------------------------------------------------------------------
// Shared mock factory
// ---------------------------------------------------------------------------

const buildMocks = () => ({
  processLogFile: { execute: jest.fn().mockResolvedValue(undefined) },
  consumerReport: {
    execute: jest.fn().mockResolvedValue('consumerId,totalRequests\nc-1,10'),
  },
  serviceReport: {
    execute: jest.fn().mockResolvedValue('serviceName,totalRequests\nsvc-1,20'),
  },
  avgLatencyReport: {
    execute: jest
      .fn()
      .mockResolvedValue(
        'serviceName,avgLatencyRequest,avgLatencyProxy,avgLatencyGateway\nsvc-1,100,50,5',
      ),
  },
});

// ---------------------------------------------------------------------------
// Test setup helper
// ---------------------------------------------------------------------------

async function createApp(
  mocks: ReturnType<typeof buildMocks>,
): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    controllers: [ReaderController, ReportsController],
    providers: [
      { provide: ProcessLogFileUseCase, useValue: mocks.processLogFile },
      { provide: CreateConsumerReportUseCase, useValue: mocks.consumerReport },
      { provide: CreateServiceReportUseCase, useValue: mocks.serviceReport },
      {
        provide: CreateAvgLatencyReportUseCase,
        useValue: mocks.avgLatencyReport,
      },
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  return app;
}

// ---------------------------------------------------------------------------
// POST /reader
// ---------------------------------------------------------------------------

describe('POST /reader', () => {
  let app: INestApplication<App>;
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(async () => {
    mocks = buildMocks();
    app = await createApp(mocks);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return 204 No Content for a valid filepath', async () => {
    await request(app.getHttpServer())
      .post('/reader')
      .send({ filepath: '/usr/src/app/log_files/logs.txt' })
      .expect(204);
  });

  it('should call ProcessLogFileUseCase.execute with the provided filepath', async () => {
    const filepath = '/usr/src/app/log_files/logs.txt';

    await request(app.getHttpServer())
      .post('/reader')
      .send({ filepath })
      .expect(204);

    expect(mocks.processLogFile.execute).toHaveBeenCalledWith(filepath);
  });

  it('should return 204 and an empty body on success', async () => {
    const res = await request(app.getHttpServer())
      .post('/reader')
      .send({ filepath: '/some/path.ndjson' });

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('should return 500 when ProcessLogFileUseCase throws', async () => {
    mocks.processLogFile.execute.mockRejectedValue(new Error('File not found'));

    const res = await request(app.getHttpServer())
      .post('/reader')
      .send({ filepath: '/nonexistent/logs.txt' });

    expect(res.status).toBe(500);
  });

  it('should call execute exactly once per request', async () => {
    await request(app.getHttpServer())
      .post('/reader')
      .send({ filepath: '/logs/file.ndjson' });

    expect(mocks.processLogFile.execute).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// GET /reports/consumer
// ---------------------------------------------------------------------------

describe('GET /reports/consumer', () => {
  let app: INestApplication<App>;
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(async () => {
    mocks = buildMocks();
    app = await createApp(mocks);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return 200 OK', async () => {
    await request(app.getHttpServer()).get('/reports/consumer').expect(200);
  });

  it('should set Content-Type to text/csv', async () => {
    const res = await request(app.getHttpServer()).get('/reports/consumer');

    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  it('should set Content-Disposition to attachment with filename consumers.csv', async () => {
    const res = await request(app.getHttpServer()).get('/reports/consumer');

    expect(res.headers['content-disposition']).toBe(
      'attachment; filename="consumers.csv"',
    );
  });

  it('should return the CSV body produced by the use case', async () => {
    const expectedCsv = 'consumerId,totalRequests\nc-1,10';
    mocks.consumerReport.execute.mockResolvedValue(expectedCsv);

    const res = await request(app.getHttpServer()).get('/reports/consumer');

    expect(res.text).toBe(expectedCsv);
  });

  it('should return 500 when CreateConsumerReportUseCase throws', async () => {
    mocks.consumerReport.execute.mockRejectedValue(new Error('DB error'));

    const res = await request(app.getHttpServer()).get('/reports/consumer');

    expect(res.status).toBe(500);
  });

  it('should call CreateConsumerReportUseCase.execute once per request', async () => {
    await request(app.getHttpServer()).get('/reports/consumer');

    expect(mocks.consumerReport.execute).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// GET /reports/service
// ---------------------------------------------------------------------------

describe('GET /reports/service', () => {
  let app: INestApplication<App>;
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(async () => {
    mocks = buildMocks();
    app = await createApp(mocks);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return 200 OK', async () => {
    await request(app.getHttpServer()).get('/reports/service').expect(200);
  });

  it('should set Content-Type to text/csv', async () => {
    const res = await request(app.getHttpServer()).get('/reports/service');

    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  it('should set Content-Disposition to attachment with filename services.csv', async () => {
    const res = await request(app.getHttpServer()).get('/reports/service');

    expect(res.headers['content-disposition']).toBe(
      'attachment; filename="services.csv"',
    );
  });

  it('should return the CSV body produced by the use case', async () => {
    const expectedCsv = 'serviceName,totalRequests\nsvc-1,20';
    mocks.serviceReport.execute.mockResolvedValue(expectedCsv);

    const res = await request(app.getHttpServer()).get('/reports/service');

    expect(res.text).toBe(expectedCsv);
  });

  it('should return 500 when CreateServiceReportUseCase throws', async () => {
    mocks.serviceReport.execute.mockRejectedValue(
      new Error('Service query failed'),
    );

    const res = await request(app.getHttpServer()).get('/reports/service');

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /reports/latency
// ---------------------------------------------------------------------------

describe('GET /reports/latency', () => {
  let app: INestApplication<App>;
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(async () => {
    mocks = buildMocks();
    app = await createApp(mocks);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return 200 OK', async () => {
    await request(app.getHttpServer()).get('/reports/latency').expect(200);
  });

  it('should set Content-Type to text/csv', async () => {
    const res = await request(app.getHttpServer()).get('/reports/latency');

    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  it('should set Content-Disposition to attachment with filename avg.csv', async () => {
    const res = await request(app.getHttpServer()).get('/reports/latency');

    expect(res.headers['content-disposition']).toBe(
      'attachment; filename="avg.csv"',
    );
  });

  it('should return the CSV body produced by the use case', async () => {
    const expectedCsv =
      'serviceName,avgLatencyRequest,avgLatencyProxy,avgLatencyGateway\nsvc-1,100,50,5';
    mocks.avgLatencyReport.execute.mockResolvedValue(expectedCsv);

    const res = await request(app.getHttpServer()).get('/reports/latency');

    expect(res.text).toBe(expectedCsv);
  });

  it('should return 500 when CreateAvgLatencyReportUseCase throws', async () => {
    mocks.avgLatencyReport.execute.mockRejectedValue(
      new Error('Latency query failed'),
    );

    const res = await request(app.getHttpServer()).get('/reports/latency');

    expect(res.status).toBe(500);
  });

  it('should call CreateAvgLatencyReportUseCase.execute once per request', async () => {
    await request(app.getHttpServer()).get('/reports/latency');

    expect(mocks.avgLatencyReport.execute).toHaveBeenCalledTimes(1);
  });
});
