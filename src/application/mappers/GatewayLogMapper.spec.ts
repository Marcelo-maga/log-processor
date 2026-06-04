import { GatewayLogMapper } from './GatewayLogMapper';
import { GatewayLog } from 'src/domain/entities/GatewayLog';
import { LogFileDto } from '../dto/LogFileDto';

describe('GatewayLogMapper', () => {
  /**
   * Builds a minimal valid LogFileDto. Individual fields can be overridden
   * via a deep-partial approach using spread on each sub-object.
   */
  const makeDto = (overrides: Partial<LogFileDto> = {}): LogFileDto => ({
    request: {
      method: 'GET',
      uri: '/api/resource',
      url: 'http://example.com/api/resource',
      size: '256',
      querystring: {},
      headers: {
        accept: 'application/json',
        host: 'example.com',
        'user-agent': 'test-agent/1.0',
      },
    },
    upstream_uri: '/resource',
    response: {
      status: 200,
      size: '128',
      headers: {
        'Content-Length': '128',
        via: '1.1 kong',
        Connection: 'keep-alive',
        'access-control-allow-credentials': 'true',
        'Content-Type': 'application/json',
        server: 'nginx',
        'access-control-allow-origin': '*',
      },
    },
    authenticated_entity: {
      consumer_id: { uuid: 'consumer-uuid-abc' },
    },
    route: {
      created_at: 1560000000,
      hosts: null,
      id: 'route-id-001',
      methods: ['GET'],
      paths: ['/api/resource'],
      preserve_host: false,
      protocols: ['http'],
      regex_priority: 0,
      service: { id: 'service-id-001' },
      strip_path: true,
      updated_at: 1560000001,
    },
    service: {
      connect_timeout: 60000,
      created_at: 1559000000,
      host: 'backend.internal',
      id: 'service-id-001',
      name: 'payments-service',
      path: '/v1',
      port: 8080,
      protocol: 'http',
      read_timeout: 60000,
      retries: 5,
      updated_at: 1559000001,
      write_timeout: 60000,
    },
    latencies: {
      proxy: 100,
      gateway: 10,
      request: 200,
    },
    client_ip: '192.168.1.1',
    started_at: 1560997891, // Unix timestamp in seconds
    ...overrides,
  });

  describe('toDomain', () => {
    it('should return a GatewayLog instance', () => {
      const dto = makeDto();
      const result = GatewayLogMapper.toDomain(dto);

      expect(result).toBeInstanceOf(GatewayLog);
    });

    it('should map consumerId from authenticated_entity.consumer_id.uuid', () => {
      const dto = makeDto({
        authenticated_entity: {
          consumer_id: { uuid: 'specific-consumer-uuid' },
        },
      });

      const result = GatewayLogMapper.toDomain(dto);

      expect(result.getConsumerId()).toBe('specific-consumer-uuid');
    });

    it('should map serviceName from service.name', () => {
      const dto = makeDto();
      // service.name is 'payments-service' in the base DTO

      const result = GatewayLogMapper.toDomain(dto);

      expect(result.getServiceName()).toBe('payments-service');
    });

    it('should map proxy latency from latencies.proxy', () => {
      const dto = makeDto({
        latencies: { proxy: 42, gateway: 10, request: 200 },
      });

      const result = GatewayLogMapper.toDomain(dto);

      expect(result.getProxyLatency()).toBe(42);
    });

    it('should map gateway latency from latencies.gateway', () => {
      const dto = makeDto({
        latencies: { proxy: 100, gateway: 7, request: 200 },
      });

      const result = GatewayLogMapper.toDomain(dto);

      expect(result.getGatewayLatency()).toBe(7);
    });

    it('should map request latency from latencies.request', () => {
      const dto = makeDto({
        latencies: { proxy: 100, gateway: 10, request: 350 },
      });

      const result = GatewayLogMapper.toDomain(dto);

      expect(result.getRequestLatency()).toBe(350);
    });

    it('should convert started_at Unix timestamp (seconds) to a JavaScript Date', () => {
      // 1560997891 seconds → milliseconds = 1560997891000
      const dto = makeDto({ started_at: 1560997891 });

      const result = GatewayLogMapper.toDomain(dto);

      expect(result.getStartedAt()).toEqual(new Date(1560997891 * 1000));
    });

    it('should produce the correct UTC date from the started_at timestamp', () => {
      // 1560997891 * 1000 ms = 2019-06-20T05:51:31.000Z
      const dto = makeDto({ started_at: 1560997891 });

      const result = GatewayLogMapper.toDomain(dto);

      expect(result.getStartedAt().toISOString()).toBe(
        new Date(1560997891 * 1000).toISOString(),
      );
    });

    it('should not assign an id (id remains undefined after mapping)', () => {
      const dto = makeDto();

      const result = GatewayLogMapper.toDomain(dto);

      expect(result.getId()).toBeUndefined();
    });

    it('should throw when dto is missing authenticated_entity', () => {
      const dto = makeDto();
      // @ts-expect-error — intentionally breaking the type to test runtime guard
      dto.authenticated_entity = undefined;

      expect(() => GatewayLogMapper.toDomain(dto)).toThrow();
    });

    it('should propagate GatewayLog validation error when consumerId uuid is empty', () => {
      const dto = makeDto({
        authenticated_entity: { consumer_id: { uuid: '' } },
      });

      expect(() => GatewayLogMapper.toDomain(dto)).toThrow(
        'consumerId is required',
      );
    });

    it('should propagate GatewayLog validation error when service.name is empty', () => {
      const dto = makeDto();
      dto.service = { ...dto.service, name: '' };

      expect(() => GatewayLogMapper.toDomain(dto)).toThrow(
        'serviceName is required',
      );
    });
  });
});
