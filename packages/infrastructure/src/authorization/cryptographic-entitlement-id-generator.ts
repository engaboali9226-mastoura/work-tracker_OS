import {
  createEntitlementId,
  type EntitlementId,
  type EntitlementIdGenerator,
} from "@worktracker/core";
import {
  randomBytes,
} from "node:crypto";

const capturedRandomBytes =
  randomBytes;
const capturedBufferIsBuffer =
  Buffer.isBuffer;
const capturedBufferToString =
  Buffer.prototype.toString;
const capturedReflectApply =
  Reflect.apply;

const ENTITLEMENT_ID_ENTROPY_BYTES =
  32;
const ENTITLEMENT_ID_LENGTH =
  43;

export class CryptographicEntitlementIdGenerator
implements EntitlementIdGenerator {

  public async generate(): Promise<EntitlementId> {
    const entropy =
      capturedRandomBytes(
        ENTITLEMENT_ID_ENTROPY_BYTES,
      );

    if (
      !capturedBufferIsBuffer(
        entropy,
      )
      || entropy.length !==
        ENTITLEMENT_ID_ENTROPY_BYTES
    ) {
      throw new TypeError(
        "Entitlement entropy must be a 32-byte Buffer.",
      );
    }

    const encoded =
      capturedReflectApply(
        capturedBufferToString,
        entropy,
        [
          "base64url",
        ],
      );

    if (
      typeof encoded !== "string"
      || encoded.length !==
        ENTITLEMENT_ID_LENGTH
    ) {
      throw new TypeError(
        "Entitlement identifier encoding is invalid.",
      );
    }

    return createEntitlementId(
      encoded,
    );
  }

}
