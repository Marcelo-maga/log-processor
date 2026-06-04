import { Latency } from './Latency';

describe('Latency', () => {
  const makeLatency = (overrides = {}) => {
    const props = { proxy: 100, gateway: 10, request: 200, ...overrides };
    return new Latency(props.proxy, props.gateway, props.request);
  };

  it('should create a valid Latency', () => {
    const latency = makeLatency();
    expect(latency.getProxy()).toBe(100);
    expect(latency.getGateway()).toBe(10);
    expect(latency.getRequest()).toBe(200);
  });

  it('should throw if proxy is missing', () => {
    expect(() => makeLatency({ proxy: 0 })).toThrow('proxyLatency is required');
  });

  it('should throw if gateway is missing', () => {
    expect(() => makeLatency({ gateway: 0 })).toThrow(
      'gatewayLatency is required',
    );
  });

  it('should throw if request is missing', () => {
    expect(() => makeLatency({ request: 0 })).toThrow(
      'requestLatency is required',
    );
  });
});
