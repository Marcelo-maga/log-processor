export class Latency {
  private proxy: number;
  private gateway: number;
  private request: number;

  public constructor(
    proxyLatency: number,
    gatewayLatency: number,
    requestLatency: number,
  ) {
    this.validate(proxyLatency, gatewayLatency, requestLatency);
    this.proxy = proxyLatency;
    this.gateway = gatewayLatency;
    this.request = requestLatency;
  }

  private validate(proxy: number, gateway: number, request: number) {
    if (!proxy) throw new Error('proxyLatency is required');
    if (!gateway) throw new Error('gatewayLatency is required');
    if (!request) throw new Error('requestLatency is required');
  }

  public getProxy(): number {
    return this.proxy;
  }
  public getGateway(): number {
    return this.gateway;
  }
  public getRequest(): number {
    return this.request;
  }
}
