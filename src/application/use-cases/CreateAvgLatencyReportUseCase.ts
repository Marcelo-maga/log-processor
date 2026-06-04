import { UseCase } from '../interfaces/UseCase';
import { Logger } from '@nestjs/common';
import { ReportsRepository } from 'src/domain/ports/outbound/database/ReportsRepository';
import { CsvSerializer } from 'src/domain/ports/outbound/file/CsvSerializer';
import { AvgLatencyReport } from '../dto/AvgLatencyReport';

export class CreateAvgLatencyReportUseCase implements UseCase<void, string> {
  private readonly logger = new Logger(CreateAvgLatencyReportUseCase.name);

  public constructor(
    private readonly csv: CsvSerializer<AvgLatencyReport>,
    private readonly reportsRepository: ReportsRepository,
  ) {}

  public async execute(): Promise<string> {
    this.logger.log('Creating AVG latency report...');

    const reportData = await this.reportsRepository.getAvgLatencyByService();

    const csv = this.csv.serialize(reportData);

    this.logger.log('AVG latency report create is finish!');

    return csv;
  }
}
