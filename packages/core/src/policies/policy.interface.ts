export interface Policy<T> {
  allows(
    subject: T,
  ): boolean;
}
