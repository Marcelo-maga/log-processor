import { UseCase } from '../interfaces/UseCase';
import { GatewayLogMapper } from '../mappers/GatewayLogMapper';
import { GatewayLog } from 'src/domain/entities/GatewayLog';
import { LogFileDto } from '../dto/LogFileDto';
import { Logger } from '@nestjs/common';
import { LogFileReader } from 'src/domain/ports/outbound/file/LogFileReader';
import { GatewayLogsRepository } from 'src/domain/ports/outbound/database/GatewayLogsRepository';

export class ProcessLogFileUseCase implements UseCase<string, void> {
  private readonly logger = new Logger(ProcessLogFileUseCase.name);

  public constructor(
    private readonly fileReader: LogFileReader,
    private readonly logRepository: GatewayLogsRepository,
  ) {}

  public async execute(filepath: string): Promise<void> {
    const BATCH_SIZE = 500;
    const batch: GatewayLog[] = [];

    const start = Date.now();
    this.logger.log(`Iniciando processamento: ${filepath}`);

    for await (const line of this.fileReader.read(filepath)) {
      try {
        const log = GatewayLogMapper.toDomain(JSON.parse(line) as LogFileDto);
        batch.push(log);
      } catch (error) {
        this.logger.warn('line JSON parse fails');
        this.logger.debug(error);
        continue;
      }

      if (batch.length >= BATCH_SIZE) {
        await this.logRepository.saveMany([...batch]);
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      await this.logRepository.saveMany(batch);
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    this.logger.log(`Processamento concluído em ${elapsed}s`);
  }
}
