-- CreateTable
CREATE TABLE "ApiGatewayLog" (
    "id" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "latencyProxy" INTEGER NOT NULL,
    "latencyGateway" INTEGER NOT NULL,
    "latencyRequest" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiGatewayLog_pkey" PRIMARY KEY ("id")
);
