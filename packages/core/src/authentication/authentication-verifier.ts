import type {
  VerifiedAuthentication,
} from "./verified-authentication.js";

export interface AuthenticationVerifier<
  Proof
> {

  verify(
    proof: Proof,
  ): Promise<VerifiedAuthentication>;

}
