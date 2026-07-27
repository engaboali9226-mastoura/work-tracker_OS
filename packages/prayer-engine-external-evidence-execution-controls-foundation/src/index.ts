export const CONTROL_PHASES=[
  "XC-01_AUTHORIZATION_AND_BASELINE_SEAL",
  "XC-02_EVIDENCE_OBLIGATION_AND_TARGET_BINDING",
  "XC-03_HOST_ALLOWLIST_COMPILATION",
  "XC-04_RETRIEVAL_CLIENT_CONFIGURATION",
  "XC-05_REDIRECT_AND_THIRD_PARTY_POLICY_ACTIVATION",
  "XC-06_CONTENT_AND_LIMIT_POLICY_ACTIVATION",
  "XC-07_RAW_CAPTURE_AND_DIGEST_PREPARATION",
  "XC-08_HTML_AND_PDF_CAPTURE_PREPARATION",
  "XC-09_DYNAMIC_RENDERING_AND_SCREENSHOT_PREPARATION",
  "XC-10_CLAIM_CONFIDENCE_AND_APPLICABILITY_PREPARATION",
  "XC-11_FRESHNESS_CONFLICT_REDACTION_AND_RETENTION_PREPARATION",
  "XC-12_OFFLINE_CONFORMANCE_CONTRACT_VALIDATION",
  "XC-13_EVIDENCE_BUNDLE_AND_NON_MUTATION_ATTESTATION",
  "XC-14_INDEPENDENT_REVIEW_AND_AUTHORIZATION",
] as const;

export const CONTROL_GATES=[
  "XG-01_AUTHORIZATION_AND_BASELINE",
  "XG-02_OBLIGATION_AND_TARGET_BINDING",
  "XG-03_HOST_AND_ADDRESS_SAFETY",
  "XG-04_RETRIEVAL_CLIENT_SAFETY",
  "XG-05_REDIRECT_AND_THIRD_PARTY_SUPPRESSION",
  "XG-06_CONTENT_TYPE_AND_RESPONSE_SAFETY",
  "XG-07_TIMEOUT_BYTE_AND_FILE_LIMITS",
  "XG-08_RAW_CAPTURE_INTEGRITY",
  "XG-09_HTML_PDF_AND_VISUAL_CAPTURE_SAFETY",
  "XG-10_CLAIM_TRACEABILITY_AND_APPLICABILITY",
  "XG-11_FRESHNESS_CONFLICT_AND_CONFIDENCE",
  "XG-12_REDACTION_CONFIDENTIALITY_AND_RETENTION",
  "XG-13_OFFLINE_CONFORMANCE",
  "XG-14_INDEPENDENT_REVIEW_AND_NON_MUTATION",
] as const;

export const CONTROL_KEYS=[
  "retrievalClient",
  "hostAllowlistRepresentation",
  "redirectPolicy",
  "contentTypeAllowlist",
  "perRequestTimeout",
  "perSourceByteLimit",
  "captureFileCountLimit",
  "htmlCaptureMethod",
  "pdfCaptureMethod",
  "dynamicPageRenderingPolicy",
  "screenshotCaptureFormat",
  "rawEvidenceBundleFormat",
  "claimLocationRepresentation",
  "confidenceVocabulary",
  "freshnessValidityWindow",
  "conflictEscalationPolicy",
  "redactionRepresentation",
  "evidenceRetentionExpiryPolicy",
] as const;

export const FAILURE_CODES=[
  "AUTHORIZATION_MISSING",
  "SCOPE_VIOLATION",
  "BASELINE_MISMATCH",
  "INVALID_RUN_IDENTITY",
  "INVALID_STATE_TRANSITION",
  "CONTROL_SELECTION_MISSING",
  "CONTROL_SELECTION_FORBIDDEN",
  "TARGET_INVALID",
  "HOST_POLICY_INVALID",
  "REDIRECT_POLICY_INVALID",
  "CONTENT_POLICY_INVALID",
  "LIMIT_POLICY_INVALID",
  "RAW_CAPTURE_INVALID",
  "HTML_CAPTURE_INVALID",
  "PDF_CAPTURE_INVALID",
  "RENDERING_POLICY_INVALID",
  "CLAIM_INVALID",
  "FRESHNESS_INVALID",
  "CONFLICT_UNRESOLVED",
  "REDACTION_INVALID",
  "RETENTION_INVALID",
  "MANIFEST_INCOMPLETE",
  "RESULT_SEAL_MISMATCH",
  "REPOSITORY_MUTATION_DETECTED",
] as const;

export type Phase=(typeof CONTROL_PHASES)[number];
export type Gate=(typeof CONTROL_GATES)[number];
export type Key=(typeof CONTROL_KEYS)[number];
export type Failure=(typeof FAILURE_CODES)[number];

export class ControlError extends Error{
  constructor(
    public readonly code:Failure,
    message:string,
  ){
    super(message);
    this.name="ControlError";
  }
}

export type Selections=Readonly<Record<Key,string|null>>;

export interface Authorization{
  foundation:true;
  selection:false;
  realNetworkImplementation:false;
  network:false;
  dns:false;
  collection:false;
  screenshot:false;
  pdf:false;
  verification:false;
  experiment:false;
  dependencyInstallation:false;
  candidateExecution:false;
  adapter:false;
  commit:false;
  tag:false;
  push:false;
}

export interface Baseline{
  runId:string;
  requirementsHash:string;
  designHash:string;
  foundationHash:string;
  createdAt:string;
}

export interface Snapshot{
  runId:string;
  phase:Phase;
  terminal:boolean;
  failure:Failure|null;
  transitions:readonly Readonly<{
    from:Phase|null;
    to:Phase;
    at:string;
  }>[];
}

export interface GateRecord{
  gate:Gate;
  state:"NOT_READY"|"PASS"|"FAIL";
  evidenceIds:readonly string[];
  blockers:readonly string[];
}

const HASH=/^[a-f0-9]{64}$/u;
const RUN=/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/u;
const HOST=/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u;

const FORBIDDEN=new Set([
  "score",
  "scores",
  "rank",
  "ranking",
  "recommendation",
  "recommendedMechanism",
  "selectedMechanism",
  "selectedCandidate",
]);

function fail(
  code:Failure,
  message:string,
):never{
  throw new ControlError(code,message);
}

function text(
  value:string,
  code:Failure,
):void{
  if(!value.trim()){
    fail(code,"Blank value.");
  }
}

function time(
  value:string,
  code:Failure,
):void{
  if(Number.isNaN(Date.parse(value))){
    fail(code,"Invalid time.");
  }
}

function positive(
  values:readonly number[],
):void{
  if(
    values.some(
      (value)=>!Number.isSafeInteger(value)||value<=0,
    )
  ){
    fail("LIMIT_POLICY_INVALID","Invalid limit.");
  }
}

export function authorization():Authorization{
  return Object.freeze({
    foundation:true,
    selection:false,
    realNetworkImplementation:false,
    network:false,
    dns:false,
    collection:false,
    screenshot:false,
    pdf:false,
    verification:false,
    experiment:false,
    dependencyInstallation:false,
    candidateExecution:false,
    adapter:false,
    commit:false,
    tag:false,
    push:false,
  });
}

export function assertFoundation(
  value:Authorization,
):void{
  if(!value.foundation){
    fail(
      "AUTHORIZATION_MISSING",
      "Foundation unauthorized.",
    );
  }

  if(
    Object.entries(value).some(
      ([key,enabled])=>
        key!=="foundation"
        && enabled,
    )
  ){
    fail(
      "SCOPE_VIOLATION",
      "Forbidden authorization.",
    );
  }
}

export function assertRealCollection(
  value:Authorization,
):never{
  if(
    !value.realNetworkImplementation
    || !value.network
    || !value.dns
    || !value.collection
  ){
    fail(
      "AUTHORIZATION_MISSING",
      "Real collection unauthorized.",
    );
  }

  return fail(
    "SCOPE_VIOLATION",
    "Step 025 cannot authorize collection.",
  );
}

export function unselected():Selections{
  return Object.freeze(
    Object.fromEntries(
      CONTROL_KEYS.map(
        (key)=>[key,null],
      ),
    ) as Record<Key,null>,
  );
}

export function assertUnselected(
  selections:Selections,
):void{
  for(const key of CONTROL_KEYS){
    if(selections[key]!==null){
      fail(
        "CONTROL_SELECTION_FORBIDDEN",
        `Selected: ${key}.`,
      );
    }
  }
}

export function assertSelected(
  selections:Selections,
):never{
  const missing=CONTROL_KEYS.filter(
    (key)=>!selections[key]?.trim(),
  );

  return fail(
    "CONTROL_SELECTION_MISSING",
    `Real execution unavailable; missing: ${missing.join(", ")}.`,
  );
}

export function validateBaseline(
  baseline:Baseline,
):void{
  if(!RUN.test(baseline.runId)){
    fail(
      "INVALID_RUN_IDENTITY",
      "Invalid run.",
    );
  }

  for(const digest of[
    baseline.requirementsHash,
    baseline.designHash,
    baseline.foundationHash,
  ]){
    if(!HASH.test(digest)){
      fail(
        "BASELINE_MISMATCH",
        "Invalid hash.",
      );
    }
  }

  time(
    baseline.createdAt,
    "INVALID_RUN_IDENTITY",
  );
}

export class Lifecycle{
  #phase:Phase=CONTROL_PHASES[0];
  #terminal=false;
  #failure:Failure|null=null;
  #transitions:{
    from:Phase|null;
    to:Phase;
    at:string;
  }[]=[];

  constructor(
    readonly runId:string,
    readonly clock:()=>string,
  ){
    if(!RUN.test(runId)){
      fail(
        "INVALID_RUN_IDENTITY",
        "Invalid run.",
      );
    }

    this.#transitions.push({
      from:null,
      to:this.#phase,
      at:this.now(),
    });
  }

  private now():string{
    const value=this.clock();

    time(
      value,
      "INVALID_RUN_IDENTITY",
    );

    return value;
  }

  advance(
    next:Phase,
  ):Snapshot{
    const expected=
      CONTROL_PHASES[
        CONTROL_PHASES.indexOf(this.#phase)+1
      ];

    if(
      this.#terminal
      || next!==expected
    ){
      fail(
        "INVALID_STATE_TRANSITION",
        "Invalid transition.",
      );
    }

    const from=this.#phase;
    this.#phase=next;

    this.#transitions.push({
      from,
      to:next,
      at:this.now(),
    });

    if(next===CONTROL_PHASES.at(-1)){
      this.#terminal=true;
    }

    return this.snapshot();
  }

  fail(
    code:Failure,
  ):Snapshot{
    if(this.#terminal){
      fail(
        "INVALID_STATE_TRANSITION",
        "Terminal.",
      );
    }

    this.#failure=code;
    this.#terminal=true;

    return this.snapshot();
  }

  snapshot():Snapshot{
    return Object.freeze({
      runId:this.runId,
      phase:this.#phase,
      terminal:this.#terminal,
      failure:this.#failure,
      transitions:Object.freeze(
        this.#transitions.map(
          (entry)=>Object.freeze({...entry}),
        ),
      ),
    });
  }
}

function host(
  value:string,
):string{
  const normalized=value.trim().toLowerCase();

  if(
    !normalized
    || normalized.endsWith(".")
    || normalized.includes(":")
    || normalized==="localhost"
    || normalized.endsWith(".localhost")
    || normalized
      .split(".")
      .some(
        (label)=>!HOST.test(label),
      )
  ){
    fail(
      "HOST_POLICY_INVALID",
      "Invalid host.",
    );
  }

  return normalized;
}

export function validateHostPolicy(
  policy:{
    exactHosts:readonly string[];
    allowIpLiteral:false;
    allowLocalhost:false;
    allowPrivateAddress:false;
    allowTrailingDot:false;
  },
):readonly string[]{
  if(
    !policy.exactHosts.length
    || policy.allowIpLiteral
    || policy.allowLocalhost
    || policy.allowPrivateAddress
    || policy.allowTrailingDot
  ){
    fail(
      "HOST_POLICY_INVALID",
      "Open host policy.",
    );
  }

  const hosts=policy.exactHosts.map(host);

  if(new Set(hosts).size!==hosts.length){
    fail(
      "HOST_POLICY_INVALID",
      "Duplicate host.",
    );
  }

  return Object.freeze(hosts);
}

export function validateTarget(
  raw:string,
  hosts:readonly string[],
):Readonly<{
  scheme:"https";
  host:string;
  path:string;
  query:string;
  redirectsAllowed:false;
}>{
  let target:URL;

  try{
    target=new URL(raw);
  }catch{
    return fail(
      "TARGET_INVALID",
      "Invalid target.",
    );
  }

  const normalizedHost=host(target.hostname);

  if(
    target.protocol!=="https:"
    || target.username
    || target.password
    || target.hash
    || !hosts.map(host).includes(normalizedHost)
  ){
    fail(
      "TARGET_INVALID",
      "Unsafe target.",
    );
  }

  return Object.freeze({
    scheme:"https",
    host:normalizedHost,
    path:target.pathname||"/",
    query:target.search,
    redirectsAllowed:false,
  });
}

export function validateRedirect(
  policy:{
    maximumRedirects:0;
    allowCrossOrigin:false;
    allowProtocolDowngrade:false;
    allowCredentialPropagation:false;
    allowThirdPartyAssets:false;
  },
):void{
  if(
    policy.maximumRedirects!==0
    || policy.allowCrossOrigin
    || policy.allowProtocolDowngrade
    || policy.allowCredentialPropagation
    || policy.allowThirdPartyAssets
  ){
    fail(
      "REDIRECT_POLICY_INVALID",
      "Redirect policy open.",
    );
  }
}

export function validateContent(
  policy:{
    allowedContentTypes:readonly string[];
    rejectExecutable:true;
    rejectArchive:true;
    requireDetectedTypeMatch:true;
  },
):readonly string[]{
  if(
    !policy.allowedContentTypes.length
    || !policy.rejectExecutable
    || !policy.rejectArchive
    || !policy.requireDetectedTypeMatch
  ){
    fail(
      "CONTENT_POLICY_INVALID",
      "Invalid content policy.",
    );
  }

  const allowed=
    policy.allowedContentTypes.map(
      (value)=>value.trim().toLowerCase(),
    );

  if(
    allowed.some(
      (value)=>!value.includes("/"),
    )
    || new Set(allowed).size!==allowed.length
  ){
    fail(
      "CONTENT_POLICY_INVALID",
      "Invalid content type.",
    );
  }

  return Object.freeze(allowed);
}

export function validateLimits(
  policy:{
    dnsTimeoutMs:number;
    connectionTimeoutMs:number;
    firstByteTimeoutMs:number;
    idleTimeoutMs:number;
    totalRequestTimeoutMs:number;
    shutdownTimeoutMs:number;
    transferredByteLimit:number;
    decompressedByteLimit:number;
    storedByteLimit:number;
    captureFileCountLimit:number;
    pageCountLimit:number;
    screenshotCountLimit:number;
    pixelCountLimit:number;
  },
):void{
  positive(Object.values(policy));

  if(
    policy.decompressedByteLimit
      < policy.transferredByteLimit
    || policy.storedByteLimit
      < policy.transferredByteLimit
  ){
    fail(
      "LIMIT_POLICY_INVALID",
      "Inconsistent byte limits.",
    );
  }
}

export function validateRaw(
  descriptor:{
    captureId:string;
    contentType:string;
    byteCount:number;
    sha256:string;
    capturedAt:string;
    rawPreserved:true;
  },
):void{
  text(
    descriptor.captureId,
    "RAW_CAPTURE_INVALID",
  );

  text(
    descriptor.contentType,
    "RAW_CAPTURE_INVALID",
  );

  positive([descriptor.byteCount]);

  if(
    !HASH.test(descriptor.sha256)
    || !descriptor.rawPreserved
  ){
    fail(
      "RAW_CAPTURE_INVALID",
      "Invalid raw capture.",
    );
  }

  time(
    descriptor.capturedAt,
    "RAW_CAPTURE_INVALID",
  );
}

export function validateHtml(
  descriptor:{
    captureId:string;
    rawHtmlPreserved:true;
    scriptExecution:false;
    locationScheme:string;
  },
):void{
  text(
    descriptor.captureId,
    "HTML_CAPTURE_INVALID",
  );

  text(
    descriptor.locationScheme,
    "HTML_CAPTURE_INVALID",
  );

  if(
    !descriptor.rawHtmlPreserved
    || descriptor.scriptExecution
  ){
    fail(
      "HTML_CAPTURE_INVALID",
      "Invalid HTML capture.",
    );
  }
}

export function validatePdf(
  descriptor:{
    captureId:string;
    originalPdfPreserved:true;
    pageCount:number;
    scriptsExecuted:false;
    attachmentsExecuted:false;
  },
):void{
  text(
    descriptor.captureId,
    "PDF_CAPTURE_INVALID",
  );

  positive([descriptor.pageCount]);

  if(
    !descriptor.originalPdfPreserved
    || descriptor.scriptsExecuted
    || descriptor.attachmentsExecuted
  ){
    fail(
      "PDF_CAPTURE_INVALID",
      "Invalid PDF capture.",
    );
  }
}

export function validateRendering(
  descriptor:{
    enabled:false;
    cleanEphemeralProfile:true;
    outOfScopeNavigationBlocked:true;
    downloadsAllowed:false;
    permissionsAllowed:false;
    webRtcAllowed:false;
    websocketAllowed:false;
    screenshotFormat:null;
  },
):void{
  if(
    descriptor.enabled
    || !descriptor.cleanEphemeralProfile
    || !descriptor.outOfScopeNavigationBlocked
    || descriptor.downloadsAllowed
    || descriptor.permissionsAllowed
    || descriptor.webRtcAllowed
    || descriptor.websocketAllowed
    || descriptor.screenshotFormat!==null
  ){
    fail(
      "RENDERING_POLICY_INVALID",
      "Rendering must remain disabled.",
    );
  }
}

export function validateClaim(
  descriptor:{
    claimId:string;
    captureIds:readonly string[];
    location:string;
    applicability:string;
  },
):void{
  text(
    descriptor.claimId,
    "CLAIM_INVALID",
  );

  text(
    descriptor.location,
    "CLAIM_INVALID",
  );

  text(
    descriptor.applicability,
    "CLAIM_INVALID",
  );

  if(
    !descriptor.captureIds.length
    || descriptor.captureIds.some(
      (value)=>!value.trim(),
    )
  ){
    fail(
      "CLAIM_INVALID",
      "Claim untraceable.",
    );
  }
}

export function validateFreshness(
  descriptor:{
    evidenceClass:string;
    observedAt:string;
    validUntil:string|null;
    revalidationTriggers:readonly string[];
  },
):void{
  text(
    descriptor.evidenceClass,
    "FRESHNESS_INVALID",
  );

  time(
    descriptor.observedAt,
    "FRESHNESS_INVALID",
  );

  if(descriptor.validUntil!==null){
    time(
      descriptor.validUntil,
      "FRESHNESS_INVALID",
    );
  }

  if(!descriptor.revalidationTriggers.length){
    fail(
      "FRESHNESS_INVALID",
      "No trigger.",
    );
  }
}

export function validateConflict(
  descriptor:{
    conflictId:string;
    claimIds:readonly string[];
    critical:boolean;
    resolved:boolean;
    escalationOwner:string|null;
  },
):void{
  text(
    descriptor.conflictId,
    "CONFLICT_UNRESOLVED",
  );

  if(
    descriptor.claimIds.length<2
    || (
      descriptor.critical
      && !descriptor.resolved
      && !descriptor.escalationOwner?.trim()
    )
  ){
    fail(
      "CONFLICT_UNRESOLVED",
      "Unresolved critical conflict.",
    );
  }
}

export function validateRedaction(
  descriptor:{
    redactionId:string;
    rawCaptureId:string;
    redactedArtifactId:string;
    reason:string;
    rawEvidenceMutated:false;
  },
):void{
  for(const value of[
    descriptor.redactionId,
    descriptor.rawCaptureId,
    descriptor.redactedArtifactId,
    descriptor.reason,
  ]){
    text(
      value,
      "REDACTION_INVALID",
    );
  }

  if(descriptor.rawEvidenceMutated){
    fail(
      "REDACTION_INVALID",
      "Raw evidence mutated.",
    );
  }
}

export function validateRetention(
  descriptor:{
    artifactId:string;
    expiresAt:string|null;
    deletionOwner:string;
  },
):void{
  text(
    descriptor.artifactId,
    "RETENTION_INVALID",
  );

  text(
    descriptor.deletionOwner,
    "RETENTION_INVALID",
  );

  if(descriptor.expiresAt!==null){
    time(
      descriptor.expiresAt,
      "RETENTION_INVALID",
    );
  }
}

export function validateGate(
  record:GateRecord,
):void{
  if(!CONTROL_GATES.includes(record.gate)){
    fail(
      "MANIFEST_INCOMPLETE",
      "Unknown gate.",
    );
  }

  if(
    record.state==="PASS"
    && (
      !record.evidenceIds.length
      || record.blockers.length
    )
  ){
    fail(
      "MANIFEST_INCOMPLETE",
      "Invalid passing gate.",
    );
  }

  if(
    record.state==="NOT_READY"
    && !record.blockers.length
  ){
    fail(
      "MANIFEST_INCOMPLETE",
      "Missing blockers.",
    );
  }
}

function canonicalValue(
  value:unknown,
):unknown{
  if(Array.isArray(value)){
    return value.map(canonicalValue);
  }

  if(
    value!==null
    && typeof value==="object"
  ){
    const result:Record<string,unknown>={};

    for(
      const key
      of Object.keys(
        value as Record<string,unknown>,
      ).sort()
    ){
      if(FORBIDDEN.has(key)){
        fail(
          "SCOPE_VIOLATION",
          `Forbidden field: ${key}.`,
        );
      }

      const item=
        (value as Record<string,unknown>)[key];

      if(item!==undefined){
        result[key]=canonicalValue(item);
      }
    }

    return result;
  }

  if(
    value===null
    || typeof value==="string"
    || typeof value==="number"
    || typeof value==="boolean"
  ){
    return value;
  }

  return fail(
    "MANIFEST_INCOMPLETE",
    "Unsupported value.",
  );
}

export function canonical(
  value:unknown,
):string{
  const serialized=
    JSON.stringify(
      canonicalValue(value),
    );

  if(serialized===undefined){
    fail(
      "MANIFEST_INCOMPLETE",
      "Serialization failed.",
    );
  }

  return serialized;
}

export function validateManifest(
  manifest:{
    schema:"1";
    baseline:Baseline;
    lifecycle:Snapshot;
    selections:Selections;
    gates:readonly GateRecord[];
    selection:false;
    realNetworkImplementation:false;
    offlineDryRunImplementation:false;
    offlineDryRunExecution:false;
    network:false;
    dns:false;
    collection:false;
    screenshot:false;
    pdf:false;
    verification:false;
    experiment:false;
    dependencyInstallation:false;
    candidateExecution:false;
    adapter:false;
    repositoryMutation:false;
    commit:false;
    tag:false;
    push:false;
  },
):void{
  validateBaseline(manifest.baseline);
  assertUnselected(manifest.selections);
  manifest.gates.forEach(validateGate);

  const forbiddenFlags=[
    manifest.selection,
    manifest.realNetworkImplementation,
    manifest.offlineDryRunImplementation,
    manifest.offlineDryRunExecution,
    manifest.network,
    manifest.dns,
    manifest.collection,
    manifest.screenshot,
    manifest.pdf,
    manifest.verification,
    manifest.experiment,
    manifest.dependencyInstallation,
    manifest.candidateExecution,
    manifest.adapter,
    manifest.repositoryMutation,
    manifest.commit,
    manifest.tag,
    manifest.push,
  ];

  if(
    manifest.schema!=="1"
    || forbiddenFlags.some(
      (value)=>value!==false,
    )
  ){
    fail(
      "SCOPE_VIOLATION",
      "Manifest exceeds authorization.",
    );
  }

  canonical(manifest);
}

export function validateSeal(
  textValue:string,
  digest:string,
):void{
  if(
    !textValue
    || !HASH.test(digest)
  ){
    fail(
      "RESULT_SEAL_MISMATCH",
      "Invalid seal.",
    );
  }
}
