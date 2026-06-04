/* eslint-disable @typescript-eslint/unbound-method */

import { CreateServiceReportUseCase } from './CreateServiceReportUseCase';
import { ReportsRepository } from 'src/domain/ports/outbound/database/ReportsRepository';
import { CsvSerializer } from 'src/domain/ports/outbound/file/CsvSerializer';
import { ServiceReport } from '../dto/ServiceReport';

describe('CreateServiceReportUseCase', () => {
  let useCase: CreateServiceReportUseCase;
  let reportsRepository: jest.Mocked<ReportsRepository>;
  let csvSerializer: jest.Mocked<CsvSerializer<ServiceReport>>;

  const sampleReportData: ServiceReport[] = [
    { serviceName: 'payments-service', totalRequests: 1200 },
    { serviceName: 'auth-service', totalRequests: 850 },
    { serviceName: 'notification-service', totalRequests: 300 },
  ];

  const sampleCsv =
    'serviceName,totalRequests\npayments-service,1200\nauth-service,850\nnotification-service,300';

  beforeEach(() => {
    reportsRepository = {
      getTotalRequestsGrupedByConsumer: jest.fn(),
      getTotalRequestsGrupedByService: jest
        .fn()
        .mockResolvedValue(sampleReportData),
      getAvgLatencyByService: jest.fn(),
    };

    csvSerializer = {
      serialize: jest.fn().mockResolvedValue(sampleCsv),
    };

    useCase = new CreateServiceReportUseCase(csvSerializer, reportsRepository);
  });

  describe('execute', () => {
    it('should call getTotalRequestsGrupedByService on the repository', async () => {
      await useCase.execute();

      expect(
        reportsRepository.getTotalRequestsGrupedByService,
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

    it('should return an empty string when there is no service data and serializer produces empty string', async () => {
      reportsRepository.getTotalRequestsGrupedByService.mockResolvedValue([]);
      csvSerializer.serialize.mockResolvedValue('');

      const result = await useCase.execute();

      expect(result).toBe('');
    });

    it('should propagate repository errors', async () => {
      reportsRepository.getTotalRequestsGrupedByService.mockRejectedValue(
        new Error('DB unavailable'),
      );

      await expect(useCase.execute()).rejects.toThrow('DB unavailable');
    });

    it('should propagate serializer errors', async () => {
      csvSerializer.serialize.mockRejectedValue(new Error('CSV write error'));

      await expect(useCase.execute()).rejects.toThrow('CSV write error');
    });

    it('should not call getTotalRequestsGrupedByConsumer or getAvgLatencyByService', async () => {
      await useCase.execute();

      expect(
        reportsRepository.getTotalRequestsGrupedByConsumer,
      ).not.toHaveBeenCalled();
      expect(reportsRepository.getAvgLatencyByService).not.toHaveBeenCalled();
    });
  });
});
