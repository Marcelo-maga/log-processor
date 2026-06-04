import { LogFileReader } from 'src/domain/ports/outbound/LogFileReader';
import { UseCase } from '../interfaces/UseCase';
import { GatewayLogsRepository } from 'src/domain/ports/outbound/GatewayLogsRepository';
import { GatewayLogMapper } from '../mappers/GatewayLogMapper';
import { GatewayLog } from 'src/domain/entities/GatewayLog';
import { LogFileDto } from '../dto/LogFileDto';

export class ProcessLogFileUseCase implements UseCase<string, void> {
  public constructor(
    private readonly fileReader: LogFileReader,
    private readonly logRepository: GatewayLogsRepository,
  ) {}

  public async execute(filepath: string): Promise<void> {
    const BATCH_SIZE = 500;
    const batch: GatewayLog[] = [];

    for await (const line of this.fileReader.read(filepath)) {
      const log = GatewayLogMapper.toDomain(JSON.parse(line) as LogFileDto);
      batch.push(log);

      if (batch.length >= BATCH_SIZE) {
        await this.logRepository.saveMany(batch);
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      await this.logRepository.saveMany(batch);
    }
  }
}
