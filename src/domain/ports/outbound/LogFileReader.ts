export abstract class LogFileReader {
  abstract read(filePath: string): AsyncIterable<string>;
}
