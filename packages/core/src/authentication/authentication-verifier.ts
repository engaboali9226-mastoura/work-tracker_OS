import type {
  VerifiedAuthentication,
} from "./verified-authentication";

export interface AuthenticationVerifier<
  Proof
> {

  verify(
    proof: Proof,
  ): Promise<VerifiedAuthentication>;

}
