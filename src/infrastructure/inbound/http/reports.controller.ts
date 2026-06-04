import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiProduces, ApiResponse } from '@nestjs/swagger';
import { CreateAvgLatencyReportUseCase } from 'src/application/use-cases/CreateAvgLatencyReportUseCase';
import { CreateConsumerReportUseCase } from 'src/application/use-cases/CreateConsumerReportUseCase';
import { CreateServiceReportUseCase } from 'src/application/use-cases/CreateServiceReportUseCase';

@Controller('reports')
export class ReportsController {
  public constructor(
    private readonly consumerReport: CreateConsumerReportUseCase,
    private readonly serviceReport: CreateServiceReportUseCase,
    private readonly avgLatencyReport: CreateAvgLatencyReportUseCase,
  ) {}

  @Get('consumer')
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with requests by consumer',
  })
  public async getConsumerReport(@Res() res: Response) {
    const report = await this.consumerReport.execute();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="consumers.csv"',
    );

    res.send(report);
  }

  @Get('service')
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with requests by service',
  })
  public async getServiceReport(@Res() res: Response) {
    const report = await this.serviceReport.execute();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="services.csv"');

    res.send(report);
  }

  @Get('latency')
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with services and avg from requests',
  })
  public async getLatencyReport(@Res() res: Response) {
    const report = await this.avgLatencyReport.execute();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="avg.csv"');

    res.send(report);
  }
}
