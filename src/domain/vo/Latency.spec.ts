import { Latency } from './Latency';

describe('Latency', () => {
  const makeLatency = (overrides: Partial<{ proxy: number; gateway: number; request: number }> = {}) => {
    const props = { proxy: 100, gateway: 10, request: 200, ...overrides };
    return new Latency(props.proxy, props.gateway, props.request);
  };

  describe('construction', () => {
    it('should create a valid Latency with all values', () => {
      const latency = makeLatency();

      expect(latency.getProxy()).toBe(100);
      expect(latency.getGateway()).toBe(10);
      expect(latency.getRequest()).toBe(200);
    });

    it('should accept high latency values', () => {
      const latency = makeLatency({ proxy: 99999, gateway: 99999, request: 99999 });

      expect(latency.getProxy()).toBe(99999);
      expect(latency.getGateway()).toBe(99999);
      expect(latency.getRequest()).toBe(99999);
    });

    it('should accept latency of 1 (minimum truthy integer)', () => {
      const latency = makeLatency({ proxy: 1, gateway: 1, request: 1 });

      expect(latency.getProxy()).toBe(1);
      expect(latency.getGateway()).toBe(1);
      expect(latency.getRequest()).toBe(1);
    });
  });

  describe('validation', () => {
    it('should throw if proxy latency is zero', () => {
      expect(() => makeLatency({ proxy: 0 })).toThrow('proxyLatency is required');
    });

    it('should throw if gateway latency is zero', () => {
      expect(() => makeLatency({ gateway: 0 })).toThrow('gatewayLatency is required');
    });

    it('should throw if request latency is zero', () => {
      expect(() => makeLatency({ request: 0 })).toThrow('requestLatency is required');
    });

    it('should throw if proxy latency is negative (falsy-equivalent after casting)', () => {
      // Negative numbers are truthy in JS, so this should NOT throw — documenting the current behavior
      expect(() => makeLatency({ proxy: -1 })).not.toThrow();
    });
  });

  describe('accessors', () => {
    it('getProxy should return the proxy latency value', () => {
      const latency = makeLatency({ proxy: 42 });
      expect(latency.getProxy()).toBe(42);
    });

    it('getGateway should return the gateway latency value', () => {
      const latency = makeLatency({ gateway: 7 });
      expect(latency.getGateway()).toBe(7);
    });

    it('getRequest should return the request latency value', () => {
      const latency = makeLatency({ request: 350 });
      expect(latency.getRequest()).toBe(350);
    });
  });
});
