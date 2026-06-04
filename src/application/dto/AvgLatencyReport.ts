export interface AvgLatencyReport {
  serviceName: string;
  avgLatencyRequest: number;
  avgLatencyProxy: number;
  avgLatencyGateway: number;
}
