const INVALID_VERIFIED_EXTERNAL_IDENTITY_MESSAGE =
  "Verified external identity issuer and subject must be non-empty strings without surrounding whitespace.";

function requireExactIdentityPart(
  value: unknown,
): string {
  if (
    typeof value !== "string"
    || value.length === 0
    || value.trim().length === 0
    || value.trim() !== value
  ) {
    throw new TypeError(
      INVALID_VERIFIED_EXTERNAL_IDENTITY_MESSAGE,
    );
  }

  return value;
}

export class VerifiedExternalIdentity {
  readonly #issuer: string;
  readonly #subject: string;

  private constructor(
    issuer: string,
    subject: string,
  ) {
    this.#issuer =
      requireExactIdentityPart(issuer);

    this.#subject =
      requireExactIdentityPart(subject);

    Object.freeze(this);
  }

  public static create(
    issuer: string,
    subject: string,
  ): VerifiedExternalIdentity {
    return new VerifiedExternalIdentity(
      issuer,
      subject,
    );
  }

  public get issuer(): string {
    return this.#issuer;
  }

  public get subject(): string {
    return this.#subject;
  }
}
