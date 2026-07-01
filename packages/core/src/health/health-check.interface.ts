export interface HealthStatus {
  readonly healthy: boolean;

  readonly message?: string;
}

export interface HealthCheck {
  check(): Promise<HealthStatus>;
}
