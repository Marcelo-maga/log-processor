import { Latency } from '../vo/Latency';

export class GatewayLog {
  private id: string;
  private consumerId: string;
  private serviceName: string;
  private latency: Latency;
  private startedAt: Date;
  private processedAt: Date = new Date();

  public constructor(
    consumerId: string,
    serviceName: string,
    proxyLatency: number,
    gatewayLatency: number,
    requestLatency: number,
    startedAt: Date,
  ) {
    this.validate(consumerId, serviceName, startedAt);
    this.consumerId = consumerId;
    this.serviceName = serviceName;
    this.latency = new Latency(proxyLatency, gatewayLatency, requestLatency);
    this.startedAt = startedAt;
  }

  private validate(consumerId: string, serviceName: string, startedAt: Date) {
    if (!consumerId) throw new Error('consumerId is required');
    if (!serviceName) throw new Error('serviceName is required');
    if (!startedAt) throw new Error('startedAt is required');
  }

  public setId(id: string): void {
    this.id = id;
  }
  public getId(): string {
    return this.id;
  }
  public getConsumerId(): string {
    return this.consumerId;
  }
  public getServiceName(): string {
    return this.serviceName;
  }
  public getProxyLatency(): number {
    return this.latency.getProxy();
  }
  public getGatewayLatency(): number {
    return this.latency.getGateway();
  }
  public getRequestLatency(): number {
    return this.latency.getRequest();
  }
  public getStartedAt(): Date {
    return this.startedAt;
  }
  public getProcessedAt(): Date {
    return this.processedAt;
  }
}
