import { GatewayLog } from './GatewayLog';

describe('GatewayLog', () => {
  const validProps = {
    consumerId: 'consumer-123',
    serviceName: 'my-service',
    proxyLatency: 100,
    gatewayLatency: 10,
    requestLatency: 200,
    startedAt: new Date('2024-01-01'),
  };

  const makeGatewayLog = (overrides = {}) => {
    const p = { ...validProps, ...overrides };
    return new GatewayLog(
      p.consumerId,
      p.serviceName,
      p.proxyLatency,
      p.gatewayLatency,
      p.requestLatency,
      p.startedAt,
    );
  };

  it('should create a valid GatewayLog', () => {
    const log = makeGatewayLog();
    expect(log.getConsumerId()).toBe(validProps.consumerId);
    expect(log.getServiceName()).toBe(validProps.serviceName);
    expect(log.getProxyLatency()).toBe(validProps.proxyLatency);
    expect(log.getGatewayLatency()).toBe(validProps.gatewayLatency);
    expect(log.getRequestLatency()).toBe(validProps.requestLatency);
    expect(log.getStartedAt()).toBe(validProps.startedAt);
  });

  it('should set processedAt on creation', () => {
    const before = new Date();
    const log = makeGatewayLog();
    const after = new Date();
    expect(log.getProcessedAt().getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect(log.getProcessedAt().getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should set id via setId', () => {
    const log = makeGatewayLog();
    log.setId('some-uuid');
    expect(log.getId()).toBe('some-uuid');
  });

  it('should throw if consumerId is empty', () => {
    expect(() => makeGatewayLog({ consumerId: '' })).toThrow(
      'consumerId is required',
    );
  });

  it('should throw if serviceName is empty', () => {
    expect(() => makeGatewayLog({ serviceName: '' })).toThrow(
      'serviceName is required',
    );
  });

  it('should throw if startedAt is missing', () => {
    expect(() => makeGatewayLog({ startedAt: null })).toThrow(
      'startedAt is required',
    );
  });
});
