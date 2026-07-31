import type {
  UserId,
} from "../identity/user-id.js";

import type {
  AuthenticationAccountId,
} from "./authentication-account-id.js";

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
