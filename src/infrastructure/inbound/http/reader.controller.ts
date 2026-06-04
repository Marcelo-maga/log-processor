import { Body, Controller, Post } from '@nestjs/common';
import type { ReaderDto } from '../dto/ReaderDto';
import { ProcessLogFileUseCase } from 'src/application/use-cases/ProcessLogFileUseCase';

@Controller('reader')
export class ReaderController {
  public constructor(
    private readonly processLogFileUseCase: ProcessLogFileUseCase,
  ) {}

  @Post()
  public async readFileLog(@Body() body: ReaderDto) {
    await this.processLogFileUseCase.execute(body.filepath);
  }
}
