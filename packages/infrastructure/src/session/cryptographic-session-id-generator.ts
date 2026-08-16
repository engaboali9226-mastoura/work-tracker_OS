import {
  createSessionId,
  type SessionId,
  type SessionIdGenerator,
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

const SESSION_ID_ENTROPY_BYTES =
  32;
const SESSION_ID_LENGTH =
  43;

export class CryptographicSessionIdGenerator
implements SessionIdGenerator {

  public async generate(): Promise<SessionId> {
    const entropy =
      capturedRandomBytes(
        SESSION_ID_ENTROPY_BYTES,
      );

    if (
      !capturedBufferIsBuffer(
        entropy,
      ) ||
      entropy.length !==
        SESSION_ID_ENTROPY_BYTES
    ) {
      throw new TypeError(
        "Session entropy must be a 32-byte Buffer.",
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
      typeof encoded !== "string" ||
      encoded.length !==
        SESSION_ID_LENGTH
    ) {
      throw new TypeError(
        "Session identifier encoding is invalid.",
      );
    }

    return createSessionId(
      encoded,
    );
  }

}
