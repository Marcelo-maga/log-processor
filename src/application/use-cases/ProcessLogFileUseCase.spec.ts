/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/require-await */

import { ProcessLogFileUseCase } from './ProcessLogFileUseCase';
import { LogFileReader } from 'src/domain/ports/outbound/file/LogFileReader';
import { GatewayLogsRepository } from 'src/domain/ports/outbound/database/GatewayLogsRepository';
import { GatewayLog } from 'src/domain/entities/GatewayLog';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a well-formed NDJSON line. Any top-level field can be overridden,
 * but nested overrides require the full sub-object to be supplied.
 */
const makeLine = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify({
    authenticated_entity: { consumer_id: { uuid: 'consumer-123' } },
    service: { name: 'my-service' },
    latencies: { proxy: 100, gateway: 10, request: 200 },
    started_at: 1560997891,
    ...overrides,
  });

async function* toAsyncIterable(lines: string[]): AsyncIterable<string> {
  for (const line of lines) yield line;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('ProcessLogFileUseCase', () => {
  let useCase: ProcessLogFileUseCase;
  let fileReader: jest.Mocked<LogFileReader>;
  let logRepository: jest.Mocked<GatewayLogsRepository>;

  beforeEach(() => {
    fileReader = { read: jest.fn() };
    logRepository = { saveMany: jest.fn().mockResolvedValue(undefined) };
    useCase = new ProcessLogFileUseCase(fileReader, logRepository);
  });

  // -------------------------------------------------------------------------
  // Batch accumulation
  // -------------------------------------------------------------------------

  describe('batch accumulation', () => {
    it('should call saveMany once when total lines are below BATCH_SIZE (500)', async () => {
      const lines = Array.from({ length: 499 }, () => makeLine());
      fileReader.read.mockReturnValue(toAsyncIterable(lines));

      await useCase.execute('/any/path');

      // 499 records → 1 flush at the end
      expect(logRepository.saveMany).toHaveBeenCalledTimes(1);
    });

    it('should call saveMany once for exactly BATCH_SIZE (500) lines', async () => {
      const lines = Array.from({ length: 500 }, () => makeLine());
      fileReader.read.mockReturnValue(toAsyncIterable(lines));

      await useCase.execute('/any/path');

      // 500 hits threshold → flush mid-loop; batch is then empty → no final flush
      expect(logRepository.saveMany).toHaveBeenCalledTimes(1);
    });

    it('should call saveMany twice for 550 lines (one mid-loop flush + one final flush)', async () => {
      const lines = Array.from({ length: 550 }, () => makeLine());
      fileReader.read.mockReturnValue(toAsyncIterable(lines));

      await useCase.execute('/any/path');

      expect(logRepository.saveMany).toHaveBeenCalledTimes(2);
    });

    it('should pass 500 records in the first batch when given 550 lines', async () => {
      const lines = Array.from({ length: 550 }, () => makeLine());
      fileReader.read.mockReturnValue(toAsyncIterable(lines));

      await useCase.execute('/any/path');

      const firstCall = logRepository.saveMany.mock.calls[0][0];
      expect(firstCall).toHaveLength(500);
    });

    it('should pass the remaining 50 records in the second batch', async () => {
      const lines = Array.from({ length: 550 }, () => makeLine());
      fileReader.read.mockReturnValue(toAsyncIterable(lines));

      await useCase.execute('/any/path');

      const secondCall = logRepository.saveMany.mock.calls[1][0];
      expect(secondCall).toHaveLength(50);
    });

    it('should call saveMany three times for 1050 lines (two mid-loop + one final)', async () => {
      const lines = Array.from({ length: 1050 }, () => makeLine());
      fileReader.read.mockReturnValue(toAsyncIterable(lines));

      await useCase.execute('/any/path');

      expect(logRepository.saveMany).toHaveBeenCalledTimes(3);
    });
  });

  // -------------------------------------------------------------------------
  // Empty file
  // -------------------------------------------------------------------------

  describe('empty file', () => {
    it('should not call saveMany when the file is empty', async () => {
      fileReader.read.mockReturnValue(toAsyncIterable([]));

      await useCase.execute('/any/path');

      expect(logRepository.saveMany).not.toHaveBeenCalled();
    });

    it('should resolve without throwing when the file is empty', async () => {
      fileReader.read.mockReturnValue(toAsyncIterable([]));

      await expect(useCase.execute('/any/path')).resolves.toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Malformed lines
  // -------------------------------------------------------------------------

  describe('malformed / invalid lines', () => {
    it('should skip a malformed line and still resolve', async () => {
      const lines = ['not-valid-json', makeLine()];
      fileReader.read.mockReturnValue(toAsyncIterable(lines));

      await expect(useCase.execute('/any/path')).resolves.not.toThrow();
    });

    it('should still save the valid line when one malformed line precedes it', async () => {
      const lines = ['not-valid-json', makeLine()];
      fileReader.read.mockReturnValue(toAsyncIterable(lines));

      await useCase.execute('/any/path');

      expect(logRepository.saveMany).toHaveBeenCalledTimes(1);
      const savedBatch = logRepository.saveMany.mock.calls[0][0];
      expect(savedBatch).toHaveLength(1);
    });

    it('should save nothing when all lines are malformed', async () => {
      const lines = ['bad json', '{unclosed', ':::'];
      fileReader.read.mockReturnValue(toAsyncIterable(lines));

      await useCase.execute('/any/path');

      expect(logRepository.saveMany).not.toHaveBeenCalled();
    });

    it('should skip a line missing the authenticated_entity field', async () => {
      const badLine = JSON.stringify({
        service: { name: 'my-service' },
        latencies: { proxy: 100, gateway: 10, request: 200 },
        started_at: 1560997891,
        // authenticated_entity is absent
      });
      const goodLine = makeLine();
      fileReader.read.mockReturnValue(toAsyncIterable([badLine, goodLine]));

      await useCase.execute('/any/path');

      const saved = logRepository.saveMany.mock.calls[0][0];
      expect(saved).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Data integrity passed to repository
  // -------------------------------------------------------------------------

  describe('data integrity', () => {
    it('should pass GatewayLog instances to saveMany', async () => {
      fileReader.read.mockReturnValue(toAsyncIterable([makeLine()]));

      await useCase.execute('/any/path');

      const [batch] = logRepository.saveMany.mock.calls[0];
      expect(batch[0]).toBeInstanceOf(GatewayLog);
    });

    it('should map consumerId correctly', async () => {
      const line = makeLine({
        authenticated_entity: { consumer_id: { uuid: 'specific-consumer' } },
      });
      fileReader.read.mockReturnValue(toAsyncIterable([line]));

      await useCase.execute('/any/path');

      const [batch] = logRepository.saveMany.mock.calls[0];
      expect(batch[0].getConsumerId()).toBe('specific-consumer');
    });

    it('should map serviceName correctly', async () => {
      const line = makeLine({ service: { name: 'specific-service' } });
      fileReader.read.mockReturnValue(toAsyncIterable([line]));

      await useCase.execute('/any/path');

      const [batch] = logRepository.saveMany.mock.calls[0];
      expect(batch[0].getServiceName()).toBe('specific-service');
    });

    it('should forward the filepath to fileReader.read', async () => {
      fileReader.read.mockReturnValue(toAsyncIterable([]));

      await useCase.execute('/specific/path/logs.ndjson');

      expect(fileReader.read).toHaveBeenCalledWith(
        '/specific/path/logs.ndjson',
      );
    });

    it('should pass a copy (not the live batch array) to saveMany', async () => {
      // The implementation spreads the batch before passing it: [...batch]
      // This test verifies at least 500 records go in the first call
      const lines = Array.from({ length: 550 }, () => makeLine());
      fileReader.read.mockReturnValue(toAsyncIterable(lines));

      await useCase.execute('/any/path');

      // If the live reference were passed, the second call would also see 500 items
      const firstBatch = logRepository.saveMany.mock.calls[0][0];
      expect(firstBatch).toHaveLength(500);
    });
  });

  // -------------------------------------------------------------------------
  // Return value
  // -------------------------------------------------------------------------

  describe('return value', () => {
    it('should return void (undefined) on success', async () => {
      fileReader.read.mockReturnValue(toAsyncIterable([makeLine()]));

      const result = await useCase.execute('/any/path');

      expect(result).toBeUndefined();
    });
  });
});
