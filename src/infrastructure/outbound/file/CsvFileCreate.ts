import { CsvSerializer } from 'src/domain/ports/outbound/file/CsvSerializer';

export class CsvFileCreator<T> extends CsvSerializer<T> {
  // eslint-disable-next-line @typescript-eslint/require-await
  public async serialize(data: T[]): Promise<string> {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0] as object).join(',');
    const rows = data.map((row) => Object.values(row as object).join(','));

    return [headers, ...rows].join('\n');
  }
}
