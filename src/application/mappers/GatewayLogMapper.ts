import { GatewayLog } from 'src/domain/entities/GatewayLog';
import { LogFileDto } from '../dto/LogFileDto';

export class GatewayLogMapper {
  public static toDomain(log: LogFileDto): GatewayLog {
    return new GatewayLog(
      log.authenticated_entity.consumer_id.uuid,
      log.service.name,
      log.latencies.proxy,
      log.latencies.gateway,
      log.latencies.request,
      new Date(log.started_at * 1000),
    );
  }
}
