/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

import { CreateAvgLatencyReportUseCase } from './CreateAvgLatencyReportUseCase';
import { ReportsRepository } from 'src/domain/ports/outbound/database/ReportsRepository';
import { CsvSerializer } from 'src/domain/ports/outbound/file/CsvSerializer';
import { AvgLatencyReport } from '../dto/AvgLatencyReport';

describe('CreateAvgLatencyReportUseCase', () => {
  let useCase: CreateAvgLatencyReportUseCase;
  let reportsRepository: jest.Mocked<ReportsRepository>;
  let csvSerializer: jest.Mocked<CsvSerializer<AvgLatencyReport>>;

  const sampleReportData: AvgLatencyReport[] = [
    {
      serviceName: 'payments-service',
      avgLatencyRequest: 215.4,
      avgLatencyProxy: 105.2,
      avgLatencyGateway: 12.1,
    },
    {
      serviceName: 'auth-service',
      avgLatencyRequest: 98.7,
      avgLatencyProxy: 50.3,
      avgLatencyGateway: 8.5,
    },
  ];

  const sampleCsv =
    'serviceName,avgLatencyRequest,avgLatencyProxy,avgLatencyGateway\n' +
    'payments-service,215.4,105.2,12.1\n' +
    'auth-service,98.7,50.3,8.5';

  beforeEach(() => {
    reportsRepository = {
      getTotalRequestsGrupedByConsumer: jest.fn(),
      getTotalRequestsGrupedByService: jest.fn(),
      getAvgLatencyByService: jest.fn().mockResolvedValue(sampleReportData),
    };

    csvSerializer = {
      serialize: jest.fn().mockResolvedValue(sampleCsv),
    };

    useCase = new CreateAvgLatencyReportUseCase(
      csvSerializer,
      reportsRepository,
    );
  });

  describe('execute', () => {
    it('should call getAvgLatencyByService on the repository', async () => {
      await useCase.execute();

      expect(reportsRepository.getAvgLatencyByService).toHaveBeenCalledTimes(1);
    });

    it('should pass all four fields of AvgLatencyReport to the serializer', async () => {
      await useCase.execute();

      expect(csvSerializer.serialize).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            serviceName: expect.any(String),
            avgLatencyRequest: expect.any(Number),
            avgLatencyProxy: expect.any(Number),
            avgLatencyGateway: expect.any(Number),
          }),
        ]),
      );
    });

    it('should pass the exact repository data to the CSV serializer', async () => {
      await useCase.execute();

      expect(csvSerializer.serialize).toHaveBeenCalledWith(sampleReportData);
    });

    it('should return the CSV string produced by the serializer', async () => {
      const result = await useCase.execute();

      expect(result).toBe(sampleCsv);
    });

    it('should return an empty string when the repository returns no data and serializer produces empty string', async () => {
      reportsRepository.getAvgLatencyByService.mockResolvedValue([]);
      csvSerializer.serialize.mockResolvedValue('');

      const result = await useCase.execute();

      expect(result).toBe('');
    });

    it('should propagate repository errors', async () => {
      reportsRepository.getAvgLatencyByService.mockRejectedValue(
        new Error('Timeout querying avg latency'),
      );

      await expect(useCase.execute()).rejects.toThrow(
        'Timeout querying avg latency',
      );
    });

    it('should propagate serializer errors', async () => {
      csvSerializer.serialize.mockRejectedValue(new Error('Disk full'));

      await expect(useCase.execute()).rejects.toThrow('Disk full');
    });

    it('should not call consumer or service grouping methods on the repository', async () => {
      await useCase.execute();

      expect(
        reportsRepository.getTotalRequestsGrupedByConsumer,
      ).not.toHaveBeenCalled();
      expect(
        reportsRepository.getTotalRequestsGrupedByService,
      ).not.toHaveBeenCalled();
    });
  });
});
