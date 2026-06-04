import { ConsumerReport } from 'src/application/dto/ConsumerReport';
import { PgPrismaAdapter } from './PgPrismaAdapter';
import { ReportsRepository } from 'src/domain/ports/outbound/database/ReportsRepository';
import { ServiceReport } from 'src/application/dto/ServiceReport';
import { AvgLatencyReport } from 'src/application/dto/AvgLatencyReport';

export class PrismaReportsRepository implements ReportsRepository {
  public constructor(private readonly prisma: PgPrismaAdapter) {}

  public async getTotalRequestsGrupedByConsumer(): Promise<ConsumerReport[]> {
    const result = await this.prisma.apiGatewayLog.groupBy({
      by: ['consumerId'],
      _count: {
        _all: true,
      },
    });

    return result.map((item) => ({
      consumerId: item.consumerId,
      totalRequests: item._count._all,
    }));
  }

  public async getTotalRequestsGrupedByService(): Promise<ServiceReport[]> {
    const result = await this.prisma.apiGatewayLog.groupBy({
      by: ['serviceName'],
      _count: {
        _all: true,
      },
    });

    return result.map((item) => ({
      serviceName: item.serviceName,
      totalRequests: item._count._all,
    }));
  }

  public async getAvgLatencyByService(): Promise<AvgLatencyReport[]> {
    const result = await this.prisma.apiGatewayLog.groupBy({
      by: ['serviceName'],
      _avg: {
        latencyRequest: true,
        latencyProxy: true,
        latencyGateway: true,
      },
    });

    return result.map((item) => ({
      serviceName: item.serviceName,
      avgLatencyRequest: item._avg.latencyRequest ?? 0,
      avgLatencyProxy: item._avg.latencyProxy ?? 0,
      avgLatencyGateway: item._avg.latencyGateway ?? 0,
    }));
  }
}
