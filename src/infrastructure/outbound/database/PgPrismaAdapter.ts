import { Global, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Global()
@Injectable()
export class PgPrismaAdapter extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PgPrismaAdapter.name);

  public constructor() {
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL env variable is not seated');
    }

    const adapter = new PrismaPg({
      connectionString: DATABASE_URL,
    });
    super({ adapter });
  }

  public async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (error) {
      this.logger.error(error);
    }
  }
}
