import { Module } from '@nestjs/common';
import { PgPrismaAdapter } from './shared/infra/PgPrismaAdapter';

@Module({
  imports: [],
  controllers: [],
  providers: [PgPrismaAdapter],
})
export class AppModule {}
