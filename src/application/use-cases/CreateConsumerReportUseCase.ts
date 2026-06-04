import { UseCase } from '../interfaces/UseCase';
import { Logger } from '@nestjs/common';
import { ReportsRepository } from 'src/domain/ports/outbound/database/ReportsRepository';

import { ConsumerReport } from '../dto/ConsumerReport';
import { CsvSerializer } from 'src/domain/ports/outbound/file/CsvSerializer';

export class CreateConsumerReportUseCase implements UseCase<void, string> {
  private readonly logger = new Logger(CreateConsumerReportUseCase.name);

  public constructor(
    private readonly csv: CsvSerializer<ConsumerReport>,
    private readonly reportsRepository: ReportsRepository,
  ) {}

  public async execute(): Promise<string> {
    this.logger.log('Creating consumer report...');

    const reportData =
      await this.reportsRepository.getTotalRequestsGrupedByConsumer();

    const csv = this.csv.serialize(reportData);

    this.logger.log('Consumer report create is finish!');

    return csv;
  }
}
