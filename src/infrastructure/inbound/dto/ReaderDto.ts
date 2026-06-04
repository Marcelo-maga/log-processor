import { ApiProperty } from '@nestjs/swagger';

export class ReaderDto {
  @ApiProperty({ example: '/usr/src/app/log_files/logs.txt' })
  filepath: string;
}
