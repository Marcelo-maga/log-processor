import { Module } from '@nestjs/common';
import { PgPrismaAdapter } from './infrastructure/outbound/database/PgPrismaAdapter';
import { ReaderController } from './infrastructure/inbound/http/reader.controller';
import { ProcessLogFileUseCase } from './application/use-cases/ProcessLogFileUseCase';
import { LogFileReader } from './domain/ports/outbound/LogFileReader';
import { GatewayLogsRepository } from './domain/ports/outbound/GatewayLogsRepository';
import { NdjsonFileReader } from './infrastructure/outbound/file/NdjsonFileReader';
import { PrismaGatewayLogsRepository } from './infrastructure/outbound/database/PrismaGatewayLogsRepository';

@Module({
  imports: [],
  controllers: [ReaderController],
  providers: [
    PgPrismaAdapter,
    {
      provide: LogFileReader,
      useClass: NdjsonFileReader,
    },
    {
      provide: GatewayLogsRepository,
      useFactory: (prisma: PgPrismaAdapter) =>
        new PrismaGatewayLogsRepository(prisma),
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
  ],
})
export class AppModule {}
