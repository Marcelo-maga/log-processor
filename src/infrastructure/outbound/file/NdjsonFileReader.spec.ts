import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { NdjsonFileReader } from './NdjsonFileReader';

/**
 * Writes content to a temporary file and returns its path.
 * The caller is responsible for deleting it via fs.unlinkSync.
 */
function writeTempFile(content: string): string {
  const filePath = path.join(os.tmpdir(), `ndjson-reader-test-${Date.now()}-${Math.random()}.ndjson`);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

/**
 * Collects all lines emitted by the reader into an array.
 */
async function collectLines(reader: NdjsonFileReader, filePath: string): Promise<string[]> {
  const lines: string[] = [];
  for await (const line of reader.read(filePath)) {
    lines.push(line);
  }
  return lines;
}

describe('NdjsonFileReader', () => {
  let reader: NdjsonFileReader;
  const tempFiles: string[] = [];

  const createTemp = (content: string): string => {
    const p = writeTempFile(content);
    tempFiles.push(p);
    return p;
  };

  beforeEach(() => {
    reader = new NdjsonFileReader();
  });

  afterEach(() => {
    // Clean up all temp files created during the test
    for (const f of tempFiles) {
      try { fs.unlinkSync(f); } catch { /* ignore */ }
    }
    tempFiles.length = 0;
  });

  // -------------------------------------------------------------------------
  // Basic reading
  // -------------------------------------------------------------------------

  describe('basic reading', () => {
    it('should yield each line of a single-entry NDJSON file', async () => {
      const line = JSON.stringify({ key: 'value' });
      const filePath = createTemp(line + '\n');

      const lines = await collectLines(reader, filePath);

      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe(line);
    });

    it('should yield each line of a multi-entry NDJSON file', async () => {
      const entry1 = JSON.stringify({ id: 1 });
      const entry2 = JSON.stringify({ id: 2 });
      const entry3 = JSON.stringify({ id: 3 });
      const filePath = createTemp([entry1, entry2, entry3].join('\n'));

      const lines = await collectLines(reader, filePath);

      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe(entry1);
      expect(lines[1]).toBe(entry2);
      expect(lines[2]).toBe(entry3);
    });

    it('should return an empty iterable for an empty file', async () => {
      const filePath = createTemp('');

      const lines = await collectLines(reader, filePath);

      expect(lines).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Blank line filtering
  // -------------------------------------------------------------------------

  describe('blank line filtering', () => {
    it('should skip blank lines between valid entries', async () => {
      const entry1 = JSON.stringify({ id: 'a' });
      const entry2 = JSON.stringify({ id: 'b' });
      const filePath = createTemp(`${entry1}\n\n${entry2}\n`);

      const lines = await collectLines(reader, filePath);

      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe(entry1);
      expect(lines[1]).toBe(entry2);
    });

    it('should skip a file that contains only blank lines', async () => {
      const filePath = createTemp('\n\n\n');

      const lines = await collectLines(reader, filePath);

      expect(lines).toHaveLength(0);
    });

    it('should skip whitespace-only lines', async () => {
      const entry = JSON.stringify({ id: 'x' });
      // Line with only spaces should be filtered by trim()
      const filePath = createTemp(`${entry}\n   \n${entry}\n`);

      const lines = await collectLines(reader, filePath);

      expect(lines).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Content fidelity
  // -------------------------------------------------------------------------

  describe('content fidelity', () => {
    it('should preserve the raw line content without modification', async () => {
      const rawLine = '{"key":"value with spaces","num":42}';
      const filePath = createTemp(rawLine);

      const lines = await collectLines(reader, filePath);

      expect(lines[0]).toBe(rawLine);
    });

    it('should yield lines that are valid JSON parseable', async () => {
      const entry = { service: { name: 'test' }, latencies: { proxy: 1, gateway: 1, request: 1 } };
      const filePath = createTemp(JSON.stringify(entry));

      const lines = await collectLines(reader, filePath);

      expect(() => JSON.parse(lines[0])).not.toThrow();
      expect(JSON.parse(lines[0])).toEqual(entry);
    });

    it('should correctly read a large number of lines', async () => {
      const entries = Array.from({ length: 1000 }, (_, i) => JSON.stringify({ id: i }));
      const filePath = createTemp(entries.join('\n'));

      const lines = await collectLines(reader, filePath);

      expect(lines).toHaveLength(1000);
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('should throw (or reject) when the file path does not exist', async () => {
      const missingPath = '/tmp/this-file-does-not-exist-at-all.ndjson';

      await expect(collectLines(reader, missingPath)).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // CRLF line endings
  // -------------------------------------------------------------------------

  describe('CRLF line endings', () => {
    it('should handle Windows-style CRLF line endings', async () => {
      const entry1 = JSON.stringify({ id: 1 });
      const entry2 = JSON.stringify({ id: 2 });
      // crlfDelay: Infinity in readline handles this; the \r should be stripped
      const filePath = createTemp(`${entry1}\r\n${entry2}\r\n`);

      const lines = await collectLines(reader, filePath);

      expect(lines).toHaveLength(2);
      // Each line should parse cleanly (no trailing \r)
      expect(() => JSON.parse(lines[0])).not.toThrow();
      expect(() => JSON.parse(lines[1])).not.toThrow();
    });
  });
});
