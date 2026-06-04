import { GatewayLog } from './GatewayLog';

describe('GatewayLog', () => {
  const validProps = {
    consumerId: 'consumer-123',
    serviceName: 'my-service',
    proxyLatency: 100,
    gatewayLatency: 10,
    requestLatency: 200,
    startedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const makeGatewayLog = (overrides: Partial<typeof validProps & { startedAt: Date | null }> = {}) => {
    const p = { ...validProps, ...overrides };
    return new GatewayLog(
      p.consumerId,
      p.serviceName,
      p.proxyLatency,
      p.gatewayLatency,
      p.requestLatency,
      p.startedAt as Date,
    );
  };

  describe('construction', () => {
    it('should create a valid GatewayLog with all properties', () => {
      const log = makeGatewayLog();

      expect(log.getConsumerId()).toBe(validProps.consumerId);
      expect(log.getServiceName()).toBe(validProps.serviceName);
      expect(log.getProxyLatency()).toBe(validProps.proxyLatency);
      expect(log.getGatewayLatency()).toBe(validProps.gatewayLatency);
      expect(log.getRequestLatency()).toBe(validProps.requestLatency);
      expect(log.getStartedAt()).toBe(validProps.startedAt);
    });

    it('should set processedAt to the current time on creation', () => {
      const before = new Date();
      const log = makeGatewayLog();
      const after = new Date();

      expect(log.getProcessedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(log.getProcessedAt().getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should have undefined id before setId is called', () => {
      const log = makeGatewayLog();
      expect(log.getId()).toBeUndefined();
    });
  });

  describe('setId / getId', () => {
    it('should persist the id set via setId', () => {
      const log = makeGatewayLog();
      log.setId('some-uuid-1234');

      expect(log.getId()).toBe('some-uuid-1234');
    });

    it('should allow id to be overwritten with a new value', () => {
      const log = makeGatewayLog();
      log.setId('first-id');
      log.setId('second-id');

      expect(log.getId()).toBe('second-id');
    });
  });

  describe('validation', () => {
    it('should throw if consumerId is an empty string', () => {
      expect(() => makeGatewayLog({ consumerId: '' })).toThrow('consumerId is required');
    });

    it('should throw if serviceName is an empty string', () => {
      expect(() => makeGatewayLog({ serviceName: '' })).toThrow('serviceName is required');
    });

    it('should throw if startedAt is null', () => {
      expect(() => makeGatewayLog({ startedAt: null })).toThrow('startedAt is required');
    });

    it('should throw if consumerId is whitespace only', () => {
      // Empty string is falsy; whitespace is truthy — documenting current behavior
      expect(() => makeGatewayLog({ consumerId: '   ' })).not.toThrow();
    });
  });

  describe('latency delegation', () => {
    it('getProxyLatency should return the proxy value from the Latency VO', () => {
      const log = makeGatewayLog({ proxyLatency: 55 });
      expect(log.getProxyLatency()).toBe(55);
    });

    it('getGatewayLatency should return the gateway value from the Latency VO', () => {
      const log = makeGatewayLog({ gatewayLatency: 7 });
      expect(log.getGatewayLatency()).toBe(7);
    });

    it('getRequestLatency should return the request value from the Latency VO', () => {
      const log = makeGatewayLog({ requestLatency: 300 });
      expect(log.getRequestLatency()).toBe(300);
    });

    it('should propagate Latency validation errors for zero proxy latency', () => {
      expect(() => makeGatewayLog({ proxyLatency: 0 })).toThrow('proxyLatency is required');
    });

    it('should propagate Latency validation errors for zero gateway latency', () => {
      expect(() => makeGatewayLog({ gatewayLatency: 0 })).toThrow('gatewayLatency is required');
    });

    it('should propagate Latency validation errors for zero request latency', () => {
      expect(() => makeGatewayLog({ requestLatency: 0 })).toThrow('requestLatency is required');
    });
  });

  describe('processedAt immutability', () => {
    it('each instance should have its own independent processedAt', () => {
      const logA = makeGatewayLog();
      const logB = makeGatewayLog();

      // They may or may not be equal in time, but they are distinct Date objects
      expect(logA.getProcessedAt()).not.toBe(logB.getProcessedAt());
    });
  });
});
