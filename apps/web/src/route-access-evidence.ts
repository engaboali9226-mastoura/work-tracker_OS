import type {
  ApplicationKey,
} from "@worktracker/core";

export type RouteAccessEvidenceKind =
  | "authenticated-authorized"
  | "authentication-required"
  | "session-access-unavailable"
  | "authorization-denied"
  | "authorization-unavailable";

/**
 * External, already-resolved access input for one canonical application route.
 * This carries no session, entitlement, or infrastructure detail.
 */
export type RouteAccessEvidence =
  Readonly<{
    kind:
      RouteAccessEvidenceKind;
    appKey:
      ApplicationKey;
    pathname:
      string;
  }>;

export type NormalizedRouteAccessDecision =
  Readonly<{
    kind:
      RouteAccessEvidenceKind;
  }>;

const ROUTE_ACCESS_EVIDENCE_KINDS =
  new Set<RouteAccessEvidenceKind>([
    "authenticated-authorized",
    "authentication-required",
    "session-access-unavailable",
    "authorization-denied",
    "authorization-unavailable",
  ]);

export function normalizeRouteAccessEvidence(
  evidence: unknown,
  applicationKey: ApplicationKey,
  pathname: string,
): NormalizedRouteAccessDecision | undefined {
  if (!evidence || typeof evidence !== "object") {
    return undefined;
  }

  let kind: unknown;
  let evidenceApplicationKey: unknown;
  let evidencePathname: unknown;

  try {
    const candidate =
      evidence as Record<string, unknown>;

    kind = candidate.kind;
    evidenceApplicationKey = candidate.appKey;
    evidencePathname = candidate.pathname;
  } catch {
    return undefined;
  }

  if (
    typeof kind !== "string"
    || !ROUTE_ACCESS_EVIDENCE_KINDS.has(
      kind as RouteAccessEvidenceKind,
    )
    || evidenceApplicationKey !== applicationKey
    || evidencePathname !== pathname
  ) {
    return undefined;
  }

  return Object.freeze({
    kind: kind as RouteAccessEvidenceKind,
  });
}
