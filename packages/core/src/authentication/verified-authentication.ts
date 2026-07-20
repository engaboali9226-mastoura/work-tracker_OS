import type {
  UserId,
} from "../identity/user-id";

import type {
  AuthenticationAccountId,
} from "./authentication-account-id";

export class VerifiedAuthentication {

  public constructor(
    public readonly accountId:
      AuthenticationAccountId,
    public readonly userId:
      UserId,
  ) {

    Object.freeze(
      this,
    );

  }

}
