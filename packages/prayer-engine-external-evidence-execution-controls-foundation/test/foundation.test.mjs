import assert from "node:assert/strict";
import {
  CONTROL_PHASES,
  CONTROL_GATES,
  CONTROL_KEYS,
  FAILURE_CODES,
  Lifecycle,
  ControlError,
  authorization,
  assertFoundation,
  assertRealCollection,
  unselected,
  assertUnselected,
  assertSelected,
  validateBaseline,
  validateHostPolicy,
  validateTarget,
  validateRedirect,
  validateContent,
  validateLimits,
  validateRaw,
  validateHtml,
  validatePdf,
  validateRendering,
  validateClaim,
  validateFreshness,
  validateConflict,
  validateRedaction,
  validateRetention,
  validateGate,
  canonical,
  validateManifest,
  validateSeal,
} from "../dist/index.js";

const hash="a".repeat(64);
const auth=authorization();
const selections=unselected();

assertFoundation(auth);
assertUnselected(selections);
assert.equal(CONTROL_PHASES.length,14);
assert.equal(CONTROL_GATES.length,14);
assert.equal(CONTROL_KEYS.length,18);
assert.equal(FAILURE_CODES.length,24);

assert.throws(
  ()=>assertRealCollection(auth),
  (error)=>
    error instanceof ControlError
    && error.code==="AUTHORIZATION_MISSING",
);

assert.throws(
  ()=>assertSelected(selections),
  (error)=>
    error instanceof ControlError
    && error.code==="CONTROL_SELECTION_MISSING",
);

const baseline={
  runId:"controls-0001",
  requirementsHash:hash,
  designHash:hash,
  foundationHash:hash,
  createdAt:"2026-07-26T08:30:00+03:00",
};

validateBaseline(baseline);

let timeIndex=0;

const times=Array.from(
  {length:14},
  (_,index)=>
    `2026-07-26T08:${String(30+index).padStart(2,"0")}:00+03:00`,
);

const lifecycle=new Lifecycle(
  baseline.runId,
  ()=>times[timeIndex++]??times.at(-1),
);

for(const phase of CONTROL_PHASES.slice(1)){
  lifecycle.advance(phase);
}

assert.equal(
  lifecycle.snapshot().terminal,
  true,
);

const hostPolicy={
  exactHosts:["docs.example.test"],
  allowIpLiteral:false,
  allowLocalhost:false,
  allowPrivateAddress:false,
  allowTrailingDot:false,
};

assert.deepEqual(
  validateHostPolicy(hostPolicy),
  ["docs.example.test"],
);

assert.equal(
  validateTarget(
    "https://docs.example.test/r?q=1",
    hostPolicy.exactHosts,
  ).host,
  "docs.example.test",
);

assert.throws(
  ()=>validateTarget(
    "http://docs.example.test/r",
    hostPolicy.exactHosts,
  ),
  (error)=>
    error instanceof ControlError
    && error.code==="TARGET_INVALID",
);

validateRedirect({
  maximumRedirects:0,
  allowCrossOrigin:false,
  allowProtocolDowngrade:false,
  allowCredentialPropagation:false,
  allowThirdPartyAssets:false,
});

validateContent({
  allowedContentTypes:[
    "text/html",
    "application/pdf",
  ],
  rejectExecutable:true,
  rejectArchive:true,
  requireDetectedTypeMatch:true,
});

validateLimits({
  dnsTimeoutMs:1,
  connectionTimeoutMs:1,
  firstByteTimeoutMs:1,
  idleTimeoutMs:1,
  totalRequestTimeoutMs:2,
  shutdownTimeoutMs:1,
  transferredByteLimit:10,
  decompressedByteLimit:20,
  storedByteLimit:20,
  captureFileCountLimit:1,
  pageCountLimit:1,
  screenshotCountLimit:1,
  pixelCountLimit:1,
});

const rawCapture={
  captureId:"capture-1",
  contentType:"text/html",
  byteCount:1,
  sha256:hash,
  capturedAt:"2026-07-26T08:45:00+03:00",
  rawPreserved:true,
};

validateRaw(rawCapture);

validateHtml({
  captureId:rawCapture.captureId,
  rawHtmlPreserved:true,
  scriptExecution:false,
  locationScheme:"byte-range",
});

validatePdf({
  captureId:"pdf-1",
  originalPdfPreserved:true,
  pageCount:1,
  scriptsExecuted:false,
  attachmentsExecuted:false,
});

validateRendering({
  enabled:false,
  cleanEphemeralProfile:true,
  outOfScopeNavigationBlocked:true,
  downloadsAllowed:false,
  permissionsAllowed:false,
  webRtcAllowed:false,
  websocketAllowed:false,
  screenshotFormat:null,
});

validateClaim({
  claimId:"claim-1",
  captureIds:[rawCapture.captureId],
  location:"byte:0-1",
  applicability:"synthetic-fixture-only",
});

validateFreshness({
  evidenceClass:"official",
  observedAt:"2026-07-26T08:45:00+03:00",
  validUntil:null,
  revalidationTriggers:["version-change"],
});

validateConflict({
  conflictId:"conflict-1",
  claimIds:["claim-1","claim-2"],
  critical:true,
  resolved:false,
  escalationOwner:"independent-reviewer",
});

validateRedaction({
  redactionId:"redaction-1",
  rawCaptureId:rawCapture.captureId,
  redactedArtifactId:"redacted-1",
  reason:"synthetic-secret",
  rawEvidenceMutated:false,
});

validateRetention({
  artifactId:rawCapture.captureId,
  expiresAt:null,
  deletionOwner:"controller",
});

const gate={
  gate:"XG-01_AUTHORIZATION_AND_BASELINE",
  state:"NOT_READY",
  evidenceIds:[],
  blockers:["Concrete controls remain unselected"],
};

validateGate(gate);

const manifest={
  schema:"1",
  baseline,
  lifecycle:lifecycle.snapshot(),
  selections,
  gates:[gate],
  selection:false,
  realNetworkImplementation:false,
  offlineDryRunImplementation:false,
  offlineDryRunExecution:false,
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
  repositoryMutation:false,
  commit:false,
  tag:false,
  push:false,
};

validateManifest(manifest);

const canonicalManifest=canonical(manifest);
validateSeal(canonicalManifest,hash);

assert.throws(
  ()=>canonical({
    selectedMechanism:"forbidden",
  }),
  (error)=>
    error instanceof ControlError
    && error.code==="SCOPE_VIOLATION",
);

console.log(
  "NOOR_STEP_025_EXECUTION_CONTROLS_FOUNDATION_TESTS_PASS",
);
