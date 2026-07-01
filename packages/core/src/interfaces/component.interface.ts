export interface Component {
  readonly name: string;

  initialize(): Promise<void>;

  start(): Promise<void>;

  stop(): Promise<void>;
}
