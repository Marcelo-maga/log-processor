import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReaderDto } from '../dto/ReaderDto';
import { ProcessLogFileUseCase } from 'src/application/use-cases/ProcessLogFileUseCase';

@Controller('reader')
export class ReaderController {
  public constructor(
    private readonly processLogFileUseCase: ProcessLogFileUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Process an NDJSON log file' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'File processed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or missing filepath',
  })
  public async readFileLog(@Body() body: ReaderDto): Promise<void> {
    await this.processLogFileUseCase.execute(body.filepath);
  }
}
