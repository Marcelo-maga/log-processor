import * as fs from 'fs';
import * as readline from 'readline';
import { LogFileReader } from 'src/domain/ports/outbound/file/LogFileReader';

export class NdjsonFileReader extends LogFileReader {
  public async *read(filePath: string): AsyncIterable<string> {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (line.trim()) yield line;
    }
  }
}
