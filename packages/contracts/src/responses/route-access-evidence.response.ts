/**
 * Authoritative, transport-neutral access outcome for one canonical
 * application route.
 */
export type RouteAccessEvidenceKind =
    | "authenticated-authorized"
    | "authentication-required"
    | "session-access-unavailable"
    | "authorization-denied"
    | "authorization-unavailable";

export interface RouteAccessEvidenceResponse {
    readonly kind: RouteAccessEvidenceKind;
    readonly appKey: string;
    readonly pathname: string;
}
