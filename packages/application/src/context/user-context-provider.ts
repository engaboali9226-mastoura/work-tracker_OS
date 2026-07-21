import type {
  UserContext,
  UserContextCandidate,
} from "./user-context.js";

export interface UserContextProvider {
  getCurrent(): Promise<UserContextCandidate | null>;
}

export interface UserContextResolver {
  resolve(provider: UserContextProvider): Promise<UserContext>;

  resolveCandidate(
    candidate: UserContextCandidate | null,
  ): UserContext;

  assertCompatible(
    root: UserContext,
    nested: UserContext,
  ): void;
}
