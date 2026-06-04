import { GatewayLog } from 'src/domain/entities/GatewayLog';

export abstract class GatewayLogsRepository {
  abstract saveMany(batch: GatewayLog[]): Promise<void>;
}
