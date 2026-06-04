import { PgPrismaAdapter } from './PgPrismaAdapter';
import { GatewayLog } from 'src/domain/entities/GatewayLog';
import { randomUUID } from 'node:crypto';
import { GatewayLogsRepository } from 'src/domain/ports/outbound/database/GatewayLogsRepository';

export class PrismaGatewayLogsRepository implements GatewayLogsRepository {
  public constructor(private readonly prisma: PgPrismaAdapter) {}

  public async saveMany(batch: GatewayLog[]): Promise<void> {
    await this.prisma.apiGatewayLog.createMany({
      data: batch.map((log) => ({
        id: randomUUID(),
        consumerId: log.getConsumerId(),
        serviceName: log.getServiceName(),
        latencyProxy: log.getProxyLatency(),
        latencyGateway: log.getGatewayLatency(),
        latencyRequest: log.getRequestLatency(),
        startedAt: log.getStartedAt(),
      })),
    });
  }
}
