import type {
  AuthenticationAccountLinkage,
} from "./authentication-account-linkage.js";

import type {
  VerifiedExternalIdentity,
} from "./verified-external-identity.js";

export interface AuthenticationAccountLinkageResolver {
  resolve(
    identity: VerifiedExternalIdentity,
  ): Promise<AuthenticationAccountLinkage | null>;
}
