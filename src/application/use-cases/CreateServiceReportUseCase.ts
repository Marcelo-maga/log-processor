import { UseCase } from '../interfaces/UseCase';
import { Logger } from '@nestjs/common';
import { ReportsRepository } from 'src/domain/ports/outbound/database/ReportsRepository';
import { CsvSerializer } from 'src/domain/ports/outbound/file/CsvSerializer';
import { ServiceReport } from '../dto/ServiceReport';

export class CreateServiceReportUseCase implements UseCase<void, string> {
  private readonly logger = new Logger(CreateServiceReportUseCase.name);

  public constructor(
    private readonly csv: CsvSerializer<ServiceReport>,
    private readonly reportsRepository: ReportsRepository,
  ) {}

  public async execute(): Promise<string> {
    this.logger.log('Creating service report...');

    const reportData =
      await this.reportsRepository.getTotalRequestsGrupedByService();

    const csv = this.csv.serialize(reportData);

    this.logger.log('Service report create is finish!');

    return csv;
  }
}
