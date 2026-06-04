import { Module } from '@nestjs/common';
import { PgPrismaAdapter } from './infrastructure/outbound/database/PgPrismaAdapter';
import { ReaderController } from './infrastructure/inbound/http/reader.controller';
import { ReportsController } from './infrastructure/inbound/http/reports.controller';
import { ProcessLogFileUseCase } from './application/use-cases/ProcessLogFileUseCase';
import { CreateConsumerReportUseCase } from './application/use-cases/CreateConsumerReportUseCase';
import { CreateServiceReportUseCase } from './application/use-cases/CreateServiceReportUseCase';
import { CreateAvgLatencyReportUseCase } from './application/use-cases/CreateAvgLatencyReportUseCase';
import { LogFileReader } from './domain/ports/outbound/file/LogFileReader';
import { GatewayLogsRepository } from './domain/ports/outbound/database/GatewayLogsRepository';
import { ReportsRepository } from './domain/ports/outbound/database/ReportsRepository';
import { CsvSerializer } from './domain/ports/outbound/file/CsvSerializer';
import { NdjsonFileReader } from './infrastructure/outbound/file/NdjsonFileReader';
import { PrismaGatewayLogsRepository } from './infrastructure/outbound/database/PrismaGatewayLogsRepository';
import { PrismaReportsRepository } from './infrastructure/outbound/database/PrismaReportsRepository';
import { CsvFileCreator } from './infrastructure/outbound/file/CsvFileCreate';
import { ConsumerReport } from './application/dto/ConsumerReport';
import { ServiceReport } from './application/dto/ServiceReport';
import { AvgLatencyReport } from './application/dto/AvgLatencyReport';

@Module({
  imports: [],
  controllers: [ReaderController, ReportsController],
  providers: [
    PgPrismaAdapter,
    {
      provide: LogFileReader,
      useClass: NdjsonFileReader,
    },
    {
      provide: CsvSerializer,
      useClass: CsvFileCreator,
    },
    {
      provide: GatewayLogsRepository,
      useFactory: (prisma: PgPrismaAdapter) =>
        new PrismaGatewayLogsRepository(prisma),
      inject: [PgPrismaAdapter],
    },
    {
      provide: ReportsRepository,
      useFactory: (prisma: PgPrismaAdapter) =>
        new PrismaReportsRepository(prisma),
      inject: [PgPrismaAdapter],
    },
    {
      provide: ProcessLogFileUseCase,
      useFactory: (
        fileReader: LogFileReader,
        logRepository: GatewayLogsRepository,
      ) => new ProcessLogFileUseCase(fileReader, logRepository),
      inject: [LogFileReader, GatewayLogsRepository],
    },
    {
      provide: CreateConsumerReportUseCase,
      useFactory: (
        csv: CsvSerializer<ConsumerReport>,
        repository: ReportsRepository,
      ) => new CreateConsumerReportUseCase(csv, repository),
      inject: [CsvSerializer, ReportsRepository],
    },
    {
      provide: CreateServiceReportUseCase,
      useFactory: (
        csv: CsvSerializer<ServiceReport>,
        repository: ReportsRepository,
      ) => new CreateServiceReportUseCase(csv, repository),
      inject: [CsvSerializer, ReportsRepository],
    },
    {
      provide: CreateAvgLatencyReportUseCase,
      useFactory: (
        csv: CsvSerializer<AvgLatencyReport>,
        repository: ReportsRepository,
      ) => new CreateAvgLatencyReportUseCase(csv, repository),
      inject: [CsvSerializer, ReportsRepository],
    },
  ],
})
export class AppModule {}
