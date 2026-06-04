/* eslint-disable @typescript-eslint/unbound-method */

import { CreateConsumerReportUseCase } from './CreateConsumerReportUseCase';
import { ReportsRepository } from 'src/domain/ports/outbound/database/ReportsRepository';
import { CsvSerializer } from 'src/domain/ports/outbound/file/CsvSerializer';
import { ConsumerReport } from '../dto/ConsumerReport';

describe('CreateConsumerReportUseCase', () => {
  let useCase: CreateConsumerReportUseCase;
  let reportsRepository: jest.Mocked<ReportsRepository>;
  let csvSerializer: jest.Mocked<CsvSerializer<ConsumerReport>>;

  const sampleReportData: ConsumerReport[] = [
    { consumerId: 'consumer-abc', totalRequests: 42 },
    { consumerId: 'consumer-xyz', totalRequests: 17 },
  ];

  const sampleCsv =
    'consumerId,totalRequests\nconsumer-abc,42\nconsumer-xyz,17';

  beforeEach(() => {
    reportsRepository = {
      getTotalRequestsGrupedByConsumer: jest
        .fn()
        .mockResolvedValue(sampleReportData),
      getTotalRequestsGrupedByService: jest.fn(),
      getAvgLatencyByService: jest.fn(),
    };

    csvSerializer = {
      serialize: jest.fn().mockResolvedValue(sampleCsv),
    };

    useCase = new CreateConsumerReportUseCase(csvSerializer, reportsRepository);
  });

  describe('execute', () => {
    it('should call getTotalRequestsGrupedByConsumer on the repository', async () => {
      await useCase.execute();

      expect(
        reportsRepository.getTotalRequestsGrupedByConsumer,
      ).toHaveBeenCalledTimes(1);
    });

    it('should pass the repository data to the CSV serializer', async () => {
      await useCase.execute();

      expect(csvSerializer.serialize).toHaveBeenCalledWith(sampleReportData);
    });

    it('should return the CSV string produced by the serializer', async () => {
      const result = await useCase.execute();

      expect(result).toBe(sampleCsv);
    });

    it('should return an empty string when the repository returns no data and serializer produces empty string', async () => {
      reportsRepository.getTotalRequestsGrupedByConsumer.mockResolvedValue([]);
      csvSerializer.serialize.mockResolvedValue('');

      const result = await useCase.execute();

      expect(result).toBe('');
    });

    it('should propagate repository errors', async () => {
      const dbError = new Error('Database connection failed');
      reportsRepository.getTotalRequestsGrupedByConsumer.mockRejectedValue(
        dbError,
      );

      await expect(useCase.execute()).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should propagate serializer errors', async () => {
      const serializerError = new Error('Serialization failed');
      csvSerializer.serialize.mockRejectedValue(serializerError);

      await expect(useCase.execute()).rejects.toThrow('Serialization failed');
    });

    it('should not call getTotalRequestsGrupedByService or getAvgLatencyByService', async () => {
      await useCase.execute();

      expect(
        reportsRepository.getTotalRequestsGrupedByService,
      ).not.toHaveBeenCalled();
      expect(reportsRepository.getAvgLatencyByService).not.toHaveBeenCalled();
    });

    it('should call serialize exactly once per execute call', async () => {
      await useCase.execute();

      expect(csvSerializer.serialize).toHaveBeenCalledTimes(1);
    });
  });
});
