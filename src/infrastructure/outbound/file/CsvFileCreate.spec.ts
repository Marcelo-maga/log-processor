import { CsvFileCreator } from './CsvFileCreate';

describe('CsvFileCreator', () => {
  let serializer: CsvFileCreator<Record<string, unknown>>;

  beforeEach(() => {
    serializer = new CsvFileCreator();
  });

  // -------------------------------------------------------------------------
  // Empty input
  // -------------------------------------------------------------------------

  describe('empty data', () => {
    it('should return an empty string when given an empty array', async () => {
      const result = await serializer.serialize([]);

      expect(result).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Header generation
  // -------------------------------------------------------------------------

  describe('header row', () => {
    it('should use the object keys as the header row', async () => {
      const data = [{ consumerId: 'c-1', totalRequests: 5 }];

      const result = await serializer.serialize(data);
      const [header] = result.split('\n');

      expect(header).toBe('consumerId,totalRequests');
    });

    it('should derive headers from the first object only', async () => {
      // Second row has an extra key — headers are always based on first row
      const data = [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ];

      const result = await serializer.serialize(data);
      const [header] = result.split('\n');

      expect(header).toBe('a,b');
    });
  });

  // -------------------------------------------------------------------------
  // ConsumerReport shape
  // -------------------------------------------------------------------------

  describe('ConsumerReport data', () => {
    it('should serialize a single ConsumerReport row correctly', async () => {
      const data = [{ consumerId: 'consumer-abc', totalRequests: 42 }];

      const result = await serializer.serialize(data);

      expect(result).toBe('consumerId,totalRequests\nconsumer-abc,42');
    });

    it('should serialize multiple ConsumerReport rows with one header', async () => {
      const data = [
        { consumerId: 'consumer-abc', totalRequests: 42 },
        { consumerId: 'consumer-xyz', totalRequests: 17 },
      ];

      const result = await serializer.serialize(data);
      const lines = result.split('\n');

      expect(lines).toHaveLength(3); // header + 2 data rows
      expect(lines[0]).toBe('consumerId,totalRequests');
      expect(lines[1]).toBe('consumer-abc,42');
      expect(lines[2]).toBe('consumer-xyz,17');
    });
  });

  // -------------------------------------------------------------------------
  // ServiceReport shape
  // -------------------------------------------------------------------------

  describe('ServiceReport data', () => {
    it('should serialize a single ServiceReport row correctly', async () => {
      const data = [{ serviceName: 'payments-service', totalRequests: 1200 }];

      const result = await serializer.serialize(data);

      expect(result).toBe('serviceName,totalRequests\npayments-service,1200');
    });

    it('should serialize multiple ServiceReport rows', async () => {
      const data = [
        { serviceName: 'payments-service', totalRequests: 1200 },
        { serviceName: 'auth-service', totalRequests: 850 },
      ];

      const result = await serializer.serialize(data);
      const lines = result.split('\n');

      expect(lines).toHaveLength(3);
      expect(lines[1]).toBe('payments-service,1200');
      expect(lines[2]).toBe('auth-service,850');
    });
  });

  // -------------------------------------------------------------------------
  // AvgLatencyReport shape
  // -------------------------------------------------------------------------

  describe('AvgLatencyReport data', () => {
    it('should serialize all four AvgLatencyReport fields', async () => {
      const data = [
        {
          serviceName: 'auth-service',
          avgLatencyRequest: 98.7,
          avgLatencyProxy: 50.3,
          avgLatencyGateway: 8.5,
        },
      ];

      const result = await serializer.serialize(data);
      const lines = result.split('\n');

      expect(lines[0]).toBe(
        'serviceName,avgLatencyRequest,avgLatencyProxy,avgLatencyGateway',
      );
      expect(lines[1]).toBe('auth-service,98.7,50.3,8.5');
    });
  });

  // -------------------------------------------------------------------------
  // Row count integrity
  // -------------------------------------------------------------------------

  describe('row count', () => {
    it('should produce exactly (n + 1) lines for n data rows', async () => {
      const n = 10;
      const data = Array.from({ length: n }, (_, i) => ({
        consumerId: `consumer-${i}`,
        totalRequests: i * 10,
      }));

      const result = await serializer.serialize(data);
      const lines = result.split('\n');

      expect(lines).toHaveLength(n + 1);
    });
  });

  // -------------------------------------------------------------------------
  // Values are joined with commas
  // -------------------------------------------------------------------------

  describe('value formatting', () => {
    it('should join values with commas and no extra spaces', async () => {
      const data = [{ x: 'hello', y: 'world', z: 42 }];

      const result = await serializer.serialize(data);
      const [, dataRow] = result.split('\n');

      expect(dataRow).toBe('hello,world,42');
    });

    it('should preserve numeric values as-is (no quoting)', async () => {
      const data = [{ value: 3.14 }];

      const result = await serializer.serialize(data);
      const [, dataRow] = result.split('\n');

      expect(dataRow).toBe('3.14');
    });
  });
});
