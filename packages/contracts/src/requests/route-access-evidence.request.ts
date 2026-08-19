/**
 * Transport-neutral request for authoritative route-access evidence.
 *
 * The contract intentionally carries no authentication proof, session,
 * entitlement, transport, or infrastructure detail.
 */
export interface RouteAccessEvidenceRequest {
    readonly appKey: string;
    readonly pathname: string;
}
