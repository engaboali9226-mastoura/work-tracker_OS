export interface ServiceProvider {
  register(): Promise<void> | void;

  boot(): Promise<void> | void;

  shutdown?(): Promise<void> | void;
}
