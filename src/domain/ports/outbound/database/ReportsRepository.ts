import { AvgLatencyReport } from 'src/application/dto/AvgLatencyReport';
import { ConsumerReport } from 'src/application/dto/ConsumerReport';
import { ServiceReport } from 'src/application/dto/ServiceReport';

export abstract class ReportsRepository {
  abstract getTotalRequestsGrupedByConsumer(): Promise<ConsumerReport[]>;
  abstract getTotalRequestsGrupedByService(): Promise<ServiceReport[]>;
  abstract getAvgLatencyByService(): Promise<AvgLatencyReport[]>;
}
