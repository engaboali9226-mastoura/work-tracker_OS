export interface Lifecycle {
  initialize(): Promise<void>;

  start(): Promise<void>;

  stop(): Promise<void>;
}
