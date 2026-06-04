/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/require-await */

import { ProcessLogFileUseCase } from './ProcessLogFileUseCase';
import { GatewayLogMapper } from '../mappers/GatewayLogMapper';
import { LogFileReader } from 'src/domain/ports/outbound/file/LogFileReader';
import { GatewayLogsRepository } from 'src/domain/ports/outbound/database/GatewayLogsRepository';
import { LogFileDto } from '../dto/LogFileDto';

const makeLine = (overrides = {}) =>
  JSON.stringify({
    authenticated_entity: { consumer_id: { uuid: 'consumer-123' } },
    service: { name: 'my-service' },
    latencies: { proxy: 100, gateway: 10, request: 200 },
    started_at: 1560997891,
    ...overrides,
  });

async function* toAsyncIterable(lines: string[]) {
  for (const line of lines) yield line;
}

describe('ProcessLogFileUseCase', () => {
  let useCase: ProcessLogFileUseCase;
  let fileReader: jest.Mocked<LogFileReader>;
  let logRepository: jest.Mocked<GatewayLogsRepository>;

  beforeEach(() => {
    fileReader = { read: jest.fn() };
    logRepository = {
      saveMany: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ProcessLogFileUseCase(fileReader, logRepository);
  });

  it('should save logs in batches', async () => {
    const lines = Array.from({ length: 500 }, () => makeLine());
    fileReader.read.mockReturnValue(toAsyncIterable(lines));

    await useCase.execute('/any/path');

    expect(logRepository.saveMany).toHaveBeenCalledTimes(1);
    expect(logRepository.saveMany).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(Object)]),
    );
  });

  it('should flush remaining logs after last batch', async () => {
    const lines = Array.from({ length: 550 }, () => makeLine());
    fileReader.read.mockReturnValue(toAsyncIterable(lines));

    await useCase.execute('/any/path');

    expect(logRepository.saveMany).toHaveBeenCalledTimes(2);
  });

  it('should not call saveMany if file is empty', async () => {
    fileReader.read.mockReturnValue(toAsyncIterable([]));

    await useCase.execute('/any/path');

    expect(logRepository.saveMany).not.toHaveBeenCalled();
  });

  it('should skip malformed lines', async () => {
    const lines = ['invalid json', makeLine()];
    fileReader.read.mockReturnValue(toAsyncIterable(lines));

    await expect(useCase.execute('/any/path')).resolves.not.toThrow();
  });

  it('should map a valid line', () => {
    const line = makeLine();
    const dto = JSON.parse(line) as LogFileDto;
    expect(() => GatewayLogMapper.toDomain(dto)).not.toThrow();
  });
});
