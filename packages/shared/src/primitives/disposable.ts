/**
 * Shared Disposable primitive.
 */

export interface Disposable {
  dispose(): void;
}

export interface AsyncDisposable {
  dispose(): Promise<void>;
}

export function disposeAll(
  ...items: Disposable[]
): void {
  for (const item of items) {
    item.dispose();
  }
}

export async function disposeAllAsync(
  ...items: AsyncDisposable[]
): Promise<void> {
  for (const item of items) {
    await item.dispose();
  }
}
