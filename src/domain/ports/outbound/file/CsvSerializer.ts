export abstract class CsvSerializer<T> {
  abstract serialize(data: T[]): Promise<string>;
}
